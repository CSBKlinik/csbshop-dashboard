"use client";
import { useState } from "react";
import Link from "next/link"; // For navigation
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Settings,
  User,
  Menu,
  ReceiptText,
  PillBottle,
  LogOut,
} from "lucide-react"; // Icons
import { signOut } from "next-auth/react";

export function SidebarLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // For mobile menu

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className=" min-h-screen  fixed top-0 left-0">
      {/* Mobile Menu Button */}
      <button
        onClick={handleMobileMenuToggle}
        className="md:hidden p-4 text-white bg-gray-800 rounded-full md:rounded-none fixed top-0 left-0 z-50"
      >
        <Menu />
      </button>

      {/* Sidebar */}
      <div
        className={`h-screen ${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-gray-800 text-white h-full transition-all duration-300 relative md:static md:block ${
          isMobileMenuOpen ? "fixed inset-0 z-40 w-64" : "-left-64"
        } md:left-0`}
        style={{ transition: "left 0.3s ease" }}
      >
        <div className="flex justify-between items-center p-4 bg-gray-900">
          {/* Optionally add a logo */}
          <span className={`${isSidebarOpen ? "block" : "hidden"} font-bold`}>
            CSB Klinik
          </span>
          <button
            onClick={handleSidebarToggle}
            className="p-1 hover:bg-gray-700 rounded"
          >
            {isSidebarOpen ? <ArrowLeft /> : <ArrowRight />}
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex flex-col p-4 space-y-4">
          <Link
            href="/admin/laboratory"
            className="flex items-center space-x-3 hover:bg-gray-700 p-2 rounded-lg"
          >
            <Home />
            {isSidebarOpen && <span>Accueil</span>}
          </Link>
          <Link
            href="/admin/laboratory/managing-orders"
            className="flex items-center space-x-3 hover:bg-gray-700 p-2 rounded-lg"
          >
            <ReceiptText />
            {isSidebarOpen && <span>Commandes</span>}
          </Link>
          <Link
            href="/admin/laboratory/managing-stock-products"
            className="flex items-center space-x-3 hover:bg-gray-700 p-2 rounded-lg"
          >
            <PillBottle />
            {isSidebarOpen && <span>Produits</span>}
          </Link>
          <Link
            href="/admin/laboratory/settings"
            className="flex items-center space-x-3 hover:bg-gray-700 p-2 rounded-lg"
          >
            <Settings />
            {isSidebarOpen && <span>Paramètres</span>}
          </Link>
          <button
            className="flex text-red-500 items-center gap-3 p-2"
            onClick={() => signOut()}
          >
            <LogOut />
            {isSidebarOpen && <span>Déconnexion</span>}
          </button>
          {/* <Link
            href="/profile"
            className="flex items-center space-x-3 hover:bg-gray-700 p-2 rounded-lg"
          >
            <User />
            {isSidebarOpen && <span>Profil</span>}
          </Link> */}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 bg-gray-100">
        {/* Close sidebar on mobile */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}
      </div>
    </div>
  );
}
