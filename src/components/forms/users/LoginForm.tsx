"use client";
import React, { useState } from "react";
import { FaEye, FaEyeSlash, FaLock, FaUser } from "react-icons/fa";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "../../../../public/logo.png";
const LoginForm = () => {
  const [error, setError] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // État pour gérer le chargement
  const { data: session } = useSession();
  const router = useRouter();

  // Initial values for the form
  const initialValues = {
    email: "",
    password: "",
  };

  // Validation schema using Yup
  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Adresse email invalide")
      .required("Email obligatoire"),
    password: Yup.string()
      .min(6, "Le mot de passe doit contenir au moins 6 caractères")
      .required("Mot de passe obligatoire"),
  });

  // Formik hook to manage form state
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true); // Démarre le chargement
      const authentification = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (authentification?.error) {
        const errorMessage =
          authentification?.error === "CredentialsSignin"
            ? "Identifiants incorrects"
            : authentification?.error;
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
        });
        setError(errorMessage);
        setIsLoading(false); // Termine le chargement
      } else {
        console.log("authentification:", authentification);
        toast.success("Connexion réussie", {
          position: "top-right",
          autoClose: 3000,
        });
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    },
  });

  return (
    <div className="mx-auto max-w-screen-xl py-16 sm:px-6 lg:px-0  lg:max-w-[400px] ">
      <div className="relative w-[200px] h-[200px] mx-auto">
        <Image
          src={logo}
          className="w-full h-full object-contain"
          fill
          alt="Logo CSB Klinik"
        />
      </div>
      <form
        onSubmit={formik.handleSubmit}
        className="mx-auto mb-0 mt-8 max-w-md space-y-4"
      >
        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>

          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              className={`w-full -gray-200 p-4 pl-10 pe-12 text-sm shadow-sm rounded-full border border-regularBlue ${
                formik.errors.email && formik.touched.email
                  ? "border-red-500"
                  : ""
              }`}
              placeholder="Email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <span className="absolute inset-y-0 start-0 grid place-content-center px-4">
              <FaUser className="size-5 text-regularBlue" />
            </span>
          </div>
          {formik.errors.email && formik.touched.email && (
            <div className="text-red-500 text-sm mt-1">
              {formik.errors.email}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={!show ? "password" : "text"}
              className={`w-full -gray-200 p-4 pl-10 pe-12 text-sm shadow-sm rounded-full border border-regularBlue ${
                formik.errors.password && formik.touched.password
                  ? "border-red-500"
                  : ""
              }`}
              placeholder="Enter password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <span className="absolute inset-y-0 start-0 grid place-content-center px-4">
              <FaLock className="size-5 text-regularBlue" />
            </span>
            <div
              className="absolute inset-y-0 end-0 grid place-content-center px-4 underline text-regularBlue text-[12px] cursor-pointer"
              onClick={() => setShow(!show)}
            >
              {!show ? (
                <FaEye className="w-4 h-4" />
              ) : (
                <FaEyeSlash className="w-4 h-4" />
              )}
            </div>
          </div>
          {formik.errors.password && formik.touched.password && (
            <div className="text-red-500 text-sm mt-1">
              {formik.errors.password}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          {!isLoading && (
            <button
              type="submit"
              className="inline-block bg-regularBlue w-full rounded-full border border-regularBlue px-5 py-3 text-sm  text-white  
             hover:bg-transparent hover:text-regularBlue uppercase font-semibold"
              disabled={isLoading}
            >
              Connexion
            </button>
          )}
        </div>
      </form>
      {isLoading && (
        <div className="text-green-600 text-center mt-4">
          Connexion en cours...
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default LoginForm;
