import { authOptions } from "@/app/utils/lib/context/authOptions";
import { DashboardDataError, fetchDashboardData } from "@/app/utils/lib/api/dashboard-data";
import DataError from "@/components/pages/laboratories/DataError";
import { getServerSession } from "next-auth";
export const revalidate = 0;
import SettingsPage from "@/components/pages/laboratories/SettingsPage";

export default async function Setting() {
  const session = await getServerSession(authOptions);
  const jwt = (session?.user as { jwt?: string } | undefined)?.jwt;
  try {
    const user = await fetchDashboardData("/api/users/me?populate=*", jwt);
    return <SettingsPage user={user} jwt={jwt || ""} session={session} />;
  } catch (error) {
    const message = error instanceof DashboardDataError
      ? error.message : "Impossible de charger les données. Réessayez dans un instant.";
    return <DataError message={message} status={error instanceof DashboardDataError ? error.status : undefined} />;
  }
}
