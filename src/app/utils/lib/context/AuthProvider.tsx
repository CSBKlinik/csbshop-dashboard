"use client";
import { SessionProvider } from "next-auth/react";
import "../../../../app/globals.css";

export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
