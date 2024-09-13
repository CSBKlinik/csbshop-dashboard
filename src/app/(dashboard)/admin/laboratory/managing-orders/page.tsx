import { authOptions } from "@/app/utils/lib/context/authOptions";
import ManagingOrdersPage from "@/components/pages/laboratories/ManagingOrdersPage";
import { getServerSession } from "next-auth";
import React from "react";
export const revalidate = 0;

async function ManagingOrders() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const jwt = session?.user?.jwt;
  let labOrdersApi;
  const labOrders = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/orders/laboratory`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        //   @ts-ignore
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  labOrdersApi = await labOrders.json();
  return <ManagingOrdersPage orders={labOrdersApi} />;
}

export default ManagingOrders;
