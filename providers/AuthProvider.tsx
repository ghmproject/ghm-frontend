"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { fetchClientSession } from "@/lib/auth/clientAuthApi";
import type { AuthSession } from "@/lib/auth/types";

type AuthContextValue = {
  session: AuthSession | null;
  isAdmin: boolean;
  isSignedIn: boolean;
  isHydrating: boolean;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const refreshSession = useCallback(async () => {
    const next = await fetchClientSession();
    setSession(next);
    setIsHydrating(false);
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      session,
      isAdmin: session?.role === "admin",
      isSignedIn: Boolean(session),
      isHydrating,
      refreshSession,
    }),
    [session, isHydrating, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
