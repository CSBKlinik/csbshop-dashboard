import { authOptions } from "@/app/utils/lib/context/authOptions";
import { DashboardDataError, fetchDashboardData } from "@/app/utils/lib/api/dashboard-data";
import DataError from "@/components/pages/laboratories/DataError";
import { getServerSession } from "next-auth";
export const revalidate = 0;
import ManagingProductsPage from "@/components/pages/laboratories/ManagingProductsPage";

export default async function ManageProducts() {
  const session = await getServerSession(authOptions);
  const jwt = (session?.user as { jwt?: string } | undefined)?.jwt;
  try {
    const [products, orders, promotions] = await Promise.all([
      fetchDashboardData("/api/products/laboratory", jwt),
      fetchDashboardData("/api/orders/laboratory", jwt),
      fetchDashboardData("/api/promotions?populate=*", undefined, { anonymous: true }),
    ]);
    return <ManagingProductsPage session={session} products={products} orders={orders} promotion={promotions?.data} />;
  } catch (error) {
    const message = error instanceof DashboardDataError
      ? error.message : "Impossible de charger les données. Réessayez dans un instant.";
    return <DataError message={message} status={error instanceof DashboardDataError ? error.status : undefined} />;
  }
}
