"use server";

import { revalidateTag } from "next/cache";

export default async function updateOrder() {
  console.log("update order");
  revalidateTag("orders");
}
