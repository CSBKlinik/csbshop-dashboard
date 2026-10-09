import { authOptions } from "@/app/utils/lib/context/authOptions";
import { DashboardDataError, fetchDashboardData } from "@/app/utils/lib/api/dashboard-data";
import DataError from "@/components/pages/laboratories/DataError";
import { getServerSession } from "next-auth";
export const revalidate = 0;
import DashboardLabPage from "@/components/pages/laboratories/DashboardLabPage";

export default async function DashboardLaboratory() {
  const session = await getServerSession(authOptions);
  const jwt = (session?.user as { jwt?: string } | undefined)?.jwt;
  let orders;
  let errorMessage: string | undefined;
  let errorStatus: number | undefined;
  try {
    orders = await fetchDashboardData("/api/orders/laboratory", jwt);
  } catch (error) {
    errorMessage = error instanceof DashboardDataError
      ? error.message : "Impossible de charger les données. Réessayez dans un instant.";
    errorStatus = error instanceof DashboardDataError ? error.status : undefined;
  }
  if (errorMessage) return <DataError message={errorMessage} status={errorStatus} />;
  return <DashboardLabPage orders={orders} />;
}
