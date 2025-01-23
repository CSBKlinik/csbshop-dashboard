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

  const logout = () => {
    // Utilisez signOut pour déconnecter l'utilisateur
    signOut({ callbackUrl: "/" }); // Redirige vers /login après déconnexion
  };

  async function fetchMe(session: any) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/me`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.jwt}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("User data fetched:", data?.confirmed);
      } else if (response.status === 401 || response.status === 403) {
        console.log("Token expired or unauthorized. Logging out...");
        logout();
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      logout();
    }
  }

  useEffect(() => {
    // @ts-expect-error:jwt undefined
    if (session?.user?.jwt) {
      fetchMe(session);
    }
  }, [session]);

  return (
    <SessionUserContext.Provider value={{ session, logout }}>
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
