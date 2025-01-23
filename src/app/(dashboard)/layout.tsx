import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "../utils/lib/context/authOptions";
import AuthProvider from "../utils/lib/context/AuthProvider";
import { SessionUserProvider } from "../utils/lib/context/session/check-session";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CSB Klinik ",
  description: "CSB Klinik Market Place",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider session={session}>
          {" "}
          <SessionUserProvider>{children}</SessionUserProvider>{" "}
        </AuthProvider>
      </body>
    </html>
  );
}
