"use client";
import React, { useState } from "react";
import { FaLock, FaUser } from "react-icons/fa";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const LoginForm = () => {
  const [error, setError] = useState<any>(null);
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
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
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
      console.log("authentification", authentification);
      if (authentification?.error) {
        setError(authentification?.error);
        setIsLoading(false); // Termine le chargement
      } else {
        toast.success("Login successful!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    },
  });

  return (
    <div className="mx-auto max-w-screen-xl py-16 sm:px-6 lg:px-0 mt-14 lg:max-w-[400px] lg:mt-20">
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
              className={`w-full -gray-200 p-4 pl-10 pe-12 text-sm shadow-sm ${
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
              type="password"
              className={`w-full -gray-200 p-4 pl-10 pe-12 text-sm shadow-sm ${
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
            <Link
              href="/forgot-password"
              className="absolute inset-y-0 end-0 grid place-content-center px-4 underline text-regularBlue text-[12px] cursor-pointer"
            >
              Forgot password ?
            </Link>
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
              className="inline-block w-full bg-coral px-5 py-3 text-sm font-medium text-white border 
            border-coral hover:bg-transparent hover:text-coral uppercase font-semibold"
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
