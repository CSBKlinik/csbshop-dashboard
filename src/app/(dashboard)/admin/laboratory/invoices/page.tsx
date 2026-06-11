import { authOptions } from "@/app/utils/lib/context/authOptions";
import LaboratoryInvoicesClient from "@/components/pages/laboratories/LaboratoryInvoicesClient";
import { getServerSession } from "next-auth";

export const revalidate = 0;

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/me/laboratory/accounting`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // @ts-ignore
        Authorization: `Bearer ${session?.user?.jwt}`,
      },
      cache: "no-store",
    },
  );

  const accountingData = await response.json();

  return (
    <main className="w-full p-6 max-w-[1200px] mx-auto">
      <LaboratoryInvoicesClient data={accountingData} />
    </main>
  );
}
