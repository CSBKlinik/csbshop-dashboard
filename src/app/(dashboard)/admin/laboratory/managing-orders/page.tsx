import { authOptions } from "@/app/utils/lib/context/authOptions";
import { DashboardDataError, fetchDashboardData } from "@/app/utils/lib/api/dashboard-data";
import DataError from "@/components/pages/laboratories/DataError";
import { getServerSession } from "next-auth";
export const revalidate = 0;
import ManagingOrdersPage from "@/components/pages/laboratories/ManagingOrdersPage";

export default async function ManagingOrders() {
  const session = await getServerSession(authOptions);
  const jwt = (session?.user as { jwt?: string } | undefined)?.jwt;
  let orders;
  let transporters;
  let errorMessage: string | undefined;
  let errorStatus: number | undefined;
  try {
    [orders, transporters] = await Promise.all([
      fetchDashboardData("/api/orders/laboratory", jwt),
      fetchDashboardData("/api/transporters?populate=*", jwt),
    ]);
  } catch (error) {
    errorMessage = error instanceof DashboardDataError
      ? error.message : "Impossible de charger les données. Réessayez dans un instant.";
    errorStatus = error instanceof DashboardDataError ? error.status : undefined;
  }
  if (errorMessage) return <DataError message={errorMessage} status={errorStatus} />;
  return <ManagingOrdersPage orders={orders} transporters={transporters} />;
}
