import { authOptions } from "@/app/utils/lib/context/authOptions";
import { DashboardDataError, fetchDashboardData } from "@/app/utils/lib/api/dashboard-data";
import DataError from "@/components/pages/laboratories/DataError";
import { getServerSession } from "next-auth";
export const revalidate = 0;
import ManagingProductsPage from "@/components/pages/laboratories/ManagingProductsPage";

export default async function ManageProducts() {
  const session = await getServerSession(authOptions);
  const jwt = (session?.user as { jwt?: string } | undefined)?.jwt;
  let products;
  let orders;
  let promotions;
  let errorMessage: string | undefined;
  let errorStatus: number | undefined;
  try {
    [products, orders, promotions] = await Promise.all([
      fetchDashboardData("/api/products/laboratory", jwt),
      fetchDashboardData("/api/orders/laboratory", jwt),
      fetchDashboardData("/api/promotions?populate=*", undefined, { anonymous: true }),
    ]);
  } catch (error) {
    errorMessage = error instanceof DashboardDataError
      ? error.message : "Impossible de charger les données. Réessayez dans un instant.";
    errorStatus = error instanceof DashboardDataError ? error.status : undefined;
  }
  if (errorMessage) return <DataError message={errorMessage} status={errorStatus} />;
  return <ManagingProductsPage session={session} products={products} orders={orders} promotion={promotions?.data} />;
}
