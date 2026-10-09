import { authOptions } from "@/app/utils/lib/context/authOptions";
import { DashboardDataError, fetchDashboardData } from "@/app/utils/lib/api/dashboard-data";
import DataError from "@/components/pages/laboratories/DataError";
import { getServerSession } from "next-auth";
export const revalidate = 0;
import ManagingOrdersPage from "@/components/pages/laboratories/ManagingOrdersPage";

export default async function ManagingOrders() {
  const session = await getServerSession(authOptions);
  const jwt = (session?.user as { jwt?: string } | undefined)?.jwt;
  try {
    const [orders, transporters] = await Promise.all([
      fetchDashboardData("/api/orders/laboratory", jwt),
      fetchDashboardData("/api/transporters?populate=*", jwt),
    ]);
    return <ManagingOrdersPage orders={orders} transporters={transporters} />;
  } catch (error) {
    const message = error instanceof DashboardDataError
      ? error.message : "Impossible de charger les données. Réessayez dans un instant.";
    return <DataError message={message} status={error instanceof DashboardDataError ? error.status : undefined} />;
  }
}
