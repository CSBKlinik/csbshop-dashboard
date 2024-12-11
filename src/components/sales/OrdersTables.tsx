"use client";
import React, { useState } from "react";
import {
  ScanSearch,
  SquareChevronLeft,
  SquareChevronRight,
} from "lucide-react"; // Icons

type Order = {
  id: number;
  date: string;
  deliver_follow: string;
  total_amount: string;
  users_permissions_user: {
    id: number;
    username: string;
    email: string;
  };
};

export default function OrdersTable({ orders }: { orders: any }) {
  const [sortBy, setSortBy] = useState<"total_amount">("total_amount"); // Default sort by total amount
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // Default sort order
  const [searchQuery, setSearchQuery] = useState(""); // Search query for customer email
  const [currentPage, setCurrentPage] = useState(1); // Pagination state

  const ordersPerPage = 6; // Set the number of orders per page

  // Status translation and colors
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in progress":
        return { label: "En cours", color: "bg-yellow-200 text-black" };
      case "on hold":
        return { label: "En attente", color: "bg-gray-200 text-gray-800" };
      case "shipped":
        return { label: "Expédiée", color: "bg-blue-500 text-white" };
      case "completed":
        return { label: "Complétée", color: "bg-green-500 text-white" };
      case "canceled":
        return { label: "Annulée", color: "bg-red-500 text-white" };
      case "beached":
        return { label: "Échouée", color: "bg-red-800 text-white" };
      case "refunded":
        return { label: "Remboursée", color: "bg-purple-500 text-white" };
      default:
        return { label: "Inconnu", color: "bg-gray-300 text-black" };
    }
  };

  // Function to sort the orders by total amount
  const sortedOrders = orders
    .filter((order: Order) =>
      order.users_permissions_user.email
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      if (sortBy === "total_amount") {
        const amountA = parseFloat(a.total_amount);
        const amountB = parseFloat(b.total_amount);
        return sortOrder === "asc" ? amountA - amountB : amountB - amountA;
      }
    });

  // Get the orders for the current page
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  // Total pages for pagination
  const totalPages = Math.ceil(sortedOrders.length / ordersPerPage);

  // Function to toggle sorting
  const handleSort = (criteria: "total_amount") => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(criteria);
      setSortOrder("desc");
    }
  };

  // Function to handle pagination
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Rechercher par email client"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 pl-10 text-[14px] border border-gray-300 rounded-lg w-full"
        />
        <ScanSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-lg border border-gray-300">
        <table className="min-w-full bg-white text-[14px] ">
          <thead>
            <tr className="text-gray-500">
              <th className="px-4 py-2 border-b text-left">Client</th>

              <th className="px-4 py-2 border-b text-left">Status</th>
              <th
                className="px-4 py-2 border-b cursor-pointer text-left"
                onClick={() => handleSort("total_amount")}
              >
                Montant
                {sortBy === "total_amount" &&
                  (sortOrder === "asc" ? " 🔼" : " 🔽")}
              </th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order: any) => {
                const { label, color } = getStatusLabel(order.deliver_follow);
                return (
                  <tr key={order.id}>
                    <td className="px-4 py-2 border-b text-left">
                      {/* @ts-ignore */}
                      {order.users_permissions_user.firstName}{" "}
                      {/* @ts-ignore */}
                      {order.users_permissions_user.lastName}
                    </td>

                    <td className="px-4 py-2 border-b text-left">
                      <span
                        className={`px-2 py-1 inline-block rounded-lg text-[12px] font-medium ${color}`}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b text-left font-semibold">
                      €{(parseFloat(order.total_amount) / 100).toFixed(2)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-2 text-center">
                  Aucune commande disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-4 items-center mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-2 bg-blue-600 rounded-lg disabled:bg-gray-400"
        >
          <SquareChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-[14px]">
          Page {currentPage} sur {totalPages}
        </span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-2 bg-blue-600 rounded-lg disabled:bg-gray-400"
        >
          <SquareChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
