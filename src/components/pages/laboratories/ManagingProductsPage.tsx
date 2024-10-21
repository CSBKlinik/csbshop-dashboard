"use client";
import ProductManagement from "@/components/sales/ProductManagement";
import React from "react";

const ManagingProductsPage = ({
  products,
  orders,
  promotion,
  session,
}: {
  products: any;
  orders: any;
  promotion: any;
  session: any;
}) => {
  return (
    <main className="font-outfit p-6 space-y-6 w-full max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des produits</h1>
      </div>
      <ProductManagement
        credentials={session}
        products={products}
        orders={orders}
        promotions={promotion}
      />
    </main>
  );
};

export default ManagingProductsPage;
