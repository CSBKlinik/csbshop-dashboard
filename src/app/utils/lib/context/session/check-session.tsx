"use client";

import { useSession, signOut } from "next-auth/react";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface SessionContextType {
  session: any;
  logout: () => void;
}

const SessionUserContext = createContext<SessionContextType | undefined>(
  undefined
);

export const SessionUserProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();

  const [sessionError, setSessionError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const jwt = (session?.user as { jwt?: string } | undefined)?.jwt;
  const logout = () => { void signOut({ callbackUrl: "/" }); };

  useEffect(() => {
    if (!jwt) {
      setSessionError(null);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let active = true;
    async function checkSession() {
      setSessionError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          if (active) setSessionError("La connexion est mal configurée. Contactez l’administrateur.");
          return;
        }
        const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/users/me`, {
          headers: { Authorization: `Bearer ${jwt}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!active) return;
        if (response.status === 401) {
          void signOut({ callbackUrl: "/" });
        } else if (response.status === 403) {
          setSessionError("Votre compte n’a pas les permissions nécessaires. Contactez l’administrateur.");
        } else if (!response.ok) {
          setSessionError("Le service est temporairement indisponible. Vous pouvez réessayer.");
        }
      } catch {
        if (active) setSessionError("Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.");
      } finally {
        clearTimeout(timeout);
      }
    }
    void checkSession();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [jwt, retry]);

  return (
    <SessionUserContext.Provider value={{ session, logout }}>
      {sessionError && (
        <div role="alert" className="border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <p>{sessionError}</p>
          <button type="button" className="mt-2 underline" onClick={() => setRetry((value) => value + 1)}>
            Réessayer
          </button>
        </div>
      )}
      {children}
    </SessionUserContext.Provider>
  );
};

// Custom hook pour utiliser le contexte
export const useSessionUser = (): SessionContextType => {
  const context = useContext(SessionUserContext);
  if (!context) {
    throw new Error("useSessionUser must be used within a SessionUserProvider");
  }
  return context;
};
