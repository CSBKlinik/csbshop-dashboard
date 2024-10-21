"use client";
import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import des icônes

const SecurityViews = ({ credentials }: { credentials: any }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États pour gérer l'affichage des mots de passe
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required(
        "Le mot de passe actuel est requis"
      ),
      newPassword: Yup.string()
        .min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères")
        .required("Le nouveau mot de passe est requis"),
      confirmPassword: Yup.string()
        .oneOf(
          // @ts-ignore
          [Yup.ref("newPassword"), null],
          "Les mots de passe ne correspondent pas"
        )
        .required("La confirmation du mot de passe est requise"),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      let datas = {
        currentPassword: values.currentPassword,
        password: values.newPassword,
        passwordConfirmation: values.confirmPassword,
      };
      try {
        const updateResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${credentials?.user?.jwt}`,
            },
            body: JSON.stringify(datas),
          }
        );
        if (updateResponse.ok) {
          toast.success("Mot de passe modifié avec succès!", {
            position: "top-right",
            autoClose: 3000,
          });
          formik.resetForm();
        } else {
          const errorData = await updateResponse.json();
          toast.error(errorData.error.message || "Une erreur est survenue", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      } catch (error) {
        // @ts-ignore
        toast.error(error?.message, {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="w-full max-w-[500px] my-6">
      <h1 className="text-[30px] font-bold mb-20">Informations de connexion</h1>
      <p className="text-[18px] font-D-DIN-Bold mb-6">
        Modifier votre mot de passe
      </p>
      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-wrap w-full space-y-4"
      >
        <label
          htmlFor="currentPassword"
          className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 w-full"
        >
          <span className="text-xs font-medium text-gray-700">
            Mot de passe actuel
          </span>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"} // Bascule entre text et password
              id="currentPassword"
              name="currentPassword"
              placeholder="Mot de passe actuel"
              value={formik.values.currentPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm ${
                formik.touched.currentPassword && formik.errors.currentPassword
                  ? "border-red-500"
                  : ""
              }`}
            />
            <span
              className="absolute inset-y-0 end-0 flex items-center pr-3 cursor-pointer"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)} // Changement d'état
            >
              {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {formik.touched.currentPassword && formik.errors.currentPassword ? (
            <div className="text-red-500 text-sm mt-1">
              {formik.errors.currentPassword}
            </div>
          ) : null}
        </label>

        <label
          htmlFor="newPassword"
          className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 w-full"
        >
          <span className="text-xs font-medium text-gray-700">
            Nouveau mot de passe
          </span>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"} // Bascule entre text et password
              id="newPassword"
              name="newPassword"
              placeholder="Nouveau mot de passe"
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm ${
                formik.touched.newPassword && formik.errors.newPassword
                  ? "border-red-500"
                  : ""
              }`}
            />
            <span
              className="absolute inset-y-0 end-0 flex items-center pr-3 cursor-pointer"
              onClick={() => setShowNewPassword(!showNewPassword)} // Changement d'état
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {formik.touched.newPassword && formik.errors.newPassword ? (
            <div className="text-red-500 text-sm mt-1">
              {formik.errors.newPassword}
            </div>
          ) : null}
        </label>

        <label
          htmlFor="confirmPassword"
          className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 w-full"
        >
          <span className="text-xs font-medium text-gray-700">
            Confirmer le nouveau mot de passe
          </span>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"} // Bascule entre text et password
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirmer le nouveau mot de passe"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm ${
                formik.touched.confirmPassword && formik.errors.confirmPassword
                  ? "border-red-500"
                  : ""
              }`}
            />
            <span
              className="absolute inset-y-0 end-0 flex items-center pr-3 cursor-pointer"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Changement d'état
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
            <div className="text-red-500 text-sm mt-1">
              {formik.errors.confirmPassword}
            </div>
          ) : null}
        </label>

        <div className="w-full">
          <button
            type="submit"
            className={`inline-block w-full px-5 py-3 text-sm font-medium text-white border ${
              isSubmitting
                ? "bg-green-600 border-green-600"
                : "bg-blue-600 border-blue-600 hover:bg-transparent hover:text-blue-600"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enregistrement en cours..." : "Enregistrer"}
          </button>
        </div>
      </form>
      <ToastContainer />
    </div>
  );
};

export default SecurityViews;
