import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../../../globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/lib/context/authOptions";
import AuthProvider from "@/app/utils/lib/context/AuthProvider";
import { SidebarLayout } from "@/components/navigation/SibeBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CSB Klinik",
  description: "CSB Klinik Market Place",
};

export default async function RootLaboratoryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider session={session}>
          <SidebarLayout />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
