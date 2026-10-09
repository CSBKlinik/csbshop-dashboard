"use client";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import "../../../../app/globals.css";

export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const Provider = SessionProvider as unknown as React.ComponentType<{
    children: React.ReactNode;
    session: Session | null;
  }>;
  return <Provider session={session}>{children}</Provider>;
}
