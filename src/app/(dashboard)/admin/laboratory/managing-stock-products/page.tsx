import { authOptions } from "@/app/utils/lib/context/authOptions";
import ManagingProductsPage from "@/components/pages/laboratories/ManagingProductsPage";
import { getServerSession } from "next-auth";
import React from "react";
export const revalidate = 0;
// /api/products/laboratory
async function ManageProducts() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const jwt = session?.user?.jwt;
  let labProductsApi;
  const labProducts = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/products/laboratory`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        //   @ts-ignore
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  labProductsApi = await labProducts.json();
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
  let promotionApi;
  const promotions = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/promotions?populate=*`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  promotionApi = await promotions.json();
  return (
    <ManagingProductsPage
      products={labProductsApi}
      orders={labOrdersApi}
      promotion={promotionApi?.data}
    />
  );
}

export default ManageProducts;
