"use client";
import React, { useMemo } from "react";

type PurchaseItem = {
  quantity: number;
  product: {
    pricing: number;
  };
};

type Order = {
  id: number;
  deliver_follow: string;
  order_summary: {
    purchase: PurchaseItem[];
  };
  users_permissions_user: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

type CustomerStats = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  orderCount: number;
  totalAmount: number;
};

export default function TopCustomers({ orders }: { orders: Order[] }) {
  const topCustomers = useMemo(() => {
    // 1) Ne garder que les commandes « completed »
    const completed = orders.filter((o) => o.deliver_follow !== "canceled");

    // 2) Agréger
    const data: Record<number, CustomerStats> = {};
    completed.forEach((order) => {
      const {
        id: custId,
        username,
        email,
        firstName,
        lastName,
      } = order.users_permissions_user;

      const orderAmount = order.order_summary.purchase.reduce(
        (sum, item) => sum + item.quantity * item.product.pricing,
        0
      );

      if (!data[custId]) {
        data[custId] = {
          id: custId,
          username,
          email,
          firstName,
          lastName,
          orderCount: 0,
          totalAmount: 0,
        };
      }
      data[custId].orderCount += 1;
      data[custId].totalAmount += orderAmount;
    });

    // DEBUG : voyez tout ce qui a été agrégé
    console.table(
      Object.values(data).map((c) => ({
        client: `${c.lastName} ${c.firstName}`,
        commandes: c.orderCount,
        dépensé: c.totalAmount.toFixed(2),
      }))
    );

    // 3) Trier et garder les 6 premiers
    return Object.values(data)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 6);
  }, [orders]);

  return (
    <div className="grid grid-cols-1 gap-4">
      {topCustomers.length > 0 ? (
        topCustomers.map((c) => (
          <div
            key={c.id}
            className="p-4 border rounded-lg bg-white text-[14px]"
          >
            <div className="font-medium">
              {c.lastName} {c.firstName}
              <br />
              <span className="text-xs text-gray-500">{c.email}</span>
            </div>
            <div className="text-sm text-gray-700">
              Commandes: <span className="font-semibold">{c.orderCount}</span>
            </div>
            <div className="text-sm text-gray-700">
              Total dépensé:{" "}
              <span className="font-semibold">€{c.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center">Aucun client trouvé</div>
      )}
    </div>
  );
}
