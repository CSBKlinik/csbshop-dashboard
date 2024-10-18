"use client";
import React from "react";
import Image from "next/image";
import LoginForm from "../forms/users/LoginForm";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LoginPage = () => {
  return (
    <div className="relative w-full md:max-w-[400px] lg:max-w-[670px] mx-auto">
      <div className="w-full min-h-[200px]">
        <LoginForm />
      </div>
      <ToastContainer />
    </div>
  );
};

export default LoginPage;
