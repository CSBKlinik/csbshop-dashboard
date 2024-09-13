"use client";
import React, { useState } from "react";
import {
  ScanSearch,
  SquareChevronLeft,
  SquareChevronRight,
} from "lucide-react"; // Assuming you're using lucide-react for icons

export default function ProductSalesTable({
  salesMetrics,
}: {
  salesMetrics: any;
}) {
  const [sortBy, setSortBy] = useState<"quantity" | "turnover">("quantity"); // Default sort by quantity
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // Default sort order
  const [searchQuery, setSearchQuery] = useState(""); // Search query for product name
  const [currentPage, setCurrentPage] = useState(1); // Pagination state

  const productsPerPage = 6; // Set the number of products per page

  // Function to sort the products based on selected criteria (quantity or turnover)
  const sortedProducts = salesMetrics.salesPerProduct
    .filter((product: any) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      if (sortBy === "quantity") {
        return sortOrder === "asc"
          ? a.quantity - b.quantity
          : b.quantity - a.quantity;
      } else {
        return sortOrder === "asc"
          ? a.turnover - b.turnover
          : b.turnover - a.turnover;
      }
    });

  // Get the products for the current page
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  // Total pages for pagination
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

  // Function to toggle sorting
  const handleSort = (criteria: "quantity" | "turnover") => {
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
          placeholder="Rechercher un produit"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 pl-10 text-[14px] border border-gray-300 rounded-lg w-full"
        />
        <ScanSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Product Table */}
      <div className="overflow-hidden rounded-lg border border-gray-300">
        <table className="min-w-full bg-white text-[14px] ">
          <thead>
            <tr className="text-gray-500">
              <th className="px-4 py-2 border-b text-left">Produit</th>
              <th className="px-4 py-2 border-b text-left">Prix</th>
              <th className="px-4 py-2 border-b text-left">Stock</th>
              <th
                className="px-4 py-2 border-b cursor-pointer text-left"
                onClick={() => handleSort("quantity")}
              >
                Ventes
                {sortBy === "quantity" && (sortOrder === "asc" ? " 🔼" : " 🔽")}
              </th>
              <th
                className="px-4 py-2 border-b cursor-pointer text-left"
                onClick={() => handleSort("turnover")}
              >
                CA
                {sortBy === "turnover" && (sortOrder === "asc" ? " 🔼" : " 🔽")}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((product: any) => (
                <tr key={product.title}>
                  <td className="px-4 py-2 border-b text-left uppercase font-medium">
                    {product.title}
                  </td>
                  <td className="px-4 py-2 border-b text-left font-semibold">
                    €{product.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 border-b text-left">
                    <span
                      className={`px-2 py-1 inline-block rounded-lg text-sm font-medium ${
                        product.stock < 10
                          ? "bg-red-200 text-red-600"
                          : "bg-green-200 text-green-600"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-b text-left">
                    {product.quantity}
                  </td>
                  <td className="px-4 py-2 border-b text-left">
                    €{product.turnover.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-2 text-center">
                  Aucune donnée disponible.
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
