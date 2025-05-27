"use client";
import React, { useMemo, useState } from "react";
import {
  ScanSearch,
  SquareChevronLeft,
  SquareChevronRight,
} from "lucide-react";

type PurchaseItem = {
  quantity: number;
  product: { pricing: number };
};

type Order = {
  id: number;
  date: string;
  deliver_follow: string;
  order_summary: { purchase: PurchaseItem[] };
  users_permissions_user: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
  };
};

type Props = {
  orders: Order[];
};

export default function OrdersTable({ orders }: Props) {
  const [sortBy, setSortBy] = useState<"amount">("amount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ordersPerPage = 6;

  // 1. Calculer pour chaque commande son montant réel
  const ordersWithAmount = useMemo(() => {
    return orders.map((order) => {
      const amount = order.order_summary.purchase.reduce(
        (sum, item) => sum + item.quantity * item.product.pricing,
        0
      );
      return { ...order, amount };
    });
  }, [orders]);

  // 2. Filtrer par recherche et trier
  const sortedOrders = useMemo(() => {
    return ordersWithAmount
      .filter((order) =>
        order.users_permissions_user.email
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === "amount") {
          return sortOrder === "asc"
            ? a.amount - b.amount
            : b.amount - a.amount;
        }
        return 0;
      });
  }, [ordersWithAmount, searchQuery, sortBy, sortOrder]);

  const totalPages = Math.ceil(sortedOrders.length / ordersPerPage);

  // 3. Paginer
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage;
    return sortedOrders.slice(start, start + ordersPerPage);
  }, [sortedOrders, currentPage]);

  // 4. Helpers tri & pagination
  const handleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
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

  return (
    <div>
      {/* Barre de recherche */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Rechercher par email client"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 pl-10 text-[14px] border border-gray-300 rounded-lg w-full"
        />
        <ScanSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Tableau des commandes */}
      <div className="overflow-hidden rounded-lg border border-gray-300">
        <table className="min-w-full bg-white text-[14px]">
          <thead>
            <tr className="text-gray-500">
              <th className="px-4 py-2 border-b text-left">Client</th>
              <th className="px-4 py-2 border-b text-left">Status</th>
              <th
                className="px-4 py-2 border-b cursor-pointer text-left"
                onClick={handleSort}
              >
                Montant
                {sortBy === "amount" && (sortOrder === "asc" ? " 🔼" : " 🔽")}
              </th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order) => {
                const { label, color } = getStatusLabel(order.deliver_follow);
                const name = [
                  order.users_permissions_user.firstName,
                  order.users_permissions_user.lastName,
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <tr key={order.id}>
                    <td className="px-4 py-2 border-b text-left">
                      {name || order.users_permissions_user.email}
                    </td>
                    <td className="px-4 py-2 border-b text-left">
                      <span
                        className={`px-2 py-1 inline-block rounded-lg text-[12px] font-medium ${color}`}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b text-left font-semibold">
                      €{order.amount.toFixed(2)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-2 text-center">
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
          <SquareChevronLeft className="w-4 h-4 text-white" />
        </button>
        <span className="text-[14px]">
          Page {currentPage} sur {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-2 bg-blue-600 rounded-lg disabled:bg-gray-400"
        >
          <SquareChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
