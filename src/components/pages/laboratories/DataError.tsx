"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DataError({ message, status }: { message: string; status?: number }) {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-screen-lg p-8">
      <div role="alert" className="rounded border border-amber-300 bg-amber-50 p-6">
        <p>{message}</p>
        <button
          type="button"
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
          onClick={() => status === 401 ? void signOut({ callbackUrl: "/" }) : router.refresh()}
        >
          {status === 401 ? "Se reconnecter" : "Réessayer"}
        </button>
      </div>
    </main>
  );
}
