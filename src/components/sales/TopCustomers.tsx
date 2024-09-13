"use client";
import React from "react";

type Order = {
  id: number;
  total_amount: string;
  users_permissions_user: {
    id: number;
    username: string;
    email: string;
  };
};

export default function TopCustomers({ orders }: { orders: Order[] }) {
  // Calculate top customers by number of orders and total amount spent
  const customerData = orders.reduce((acc: any, order) => {
    const customer = order.users_permissions_user;
    if (!acc[customer.id]) {
      acc[customer.id] = {
        id: customer.id,
        username: customer.username,
        email: customer.email,
        orderCount: 0,
        totalAmount: 0,
      };
    }
    acc[customer.id].orderCount += 1;
    acc[customer.id].totalAmount += parseFloat(order.total_amount) / 100;
    return acc;
  }, {});

  // Convert the customerData object to an array and sort by total amount spent
  const topCustomers = Object.values(customerData)
    .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
    .slice(0, 6); // Get top 6 customers

  return (
    <div className="grid grid-cols-1 gap-4">
      {topCustomers.length > 0 ? (
        topCustomers.map((customer: any) => (
          <div
            key={customer.id}
            className="p-4 border border-gray-200 rounded-lg bg-white text-[14px]"
          >
            <div className="font-semibold ">{customer.username}</div>

            <div className="text-sm text-gray-700">
              Commandes:{" "}
              <span className="font-semibold">{customer.orderCount}</span>
            </div>
            <div className="text-sm text-gray-700 ">
              Total dépensé:{" "}
              <span className="font-semibold">
                €{customer.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center">Aucun client trouvé</div>
      )}
    </div>
  );
}
