"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { routes } from "@/config/routes";
import { canAccessAdminRoute } from "@/lib/auth/redirects";
import { useAuth } from "@/providers/AuthProvider";

type RequireAuthProps = {
  children: React.ReactNode;
  adminOnly?: boolean;
  returnTo: string;
};

export function RequireAuth({ children, adminOnly = false, returnTo }: RequireAuthProps) {
  const router = useRouter();
  const { session, isHydrating } = useAuth();

  useEffect(() => {
    if (isHydrating) return;

    const signedIn = Boolean(session);
    const allowed = adminOnly ? canAccessAdminRoute(session) : signedIn;

    if (!allowed) {
      const loginUrl = `${routes.login}?returnTo=${encodeURIComponent(returnTo)}`;
      router.replace(loginUrl);
    }
  }, [adminOnly, isHydrating, returnTo, router, session]);

  if (isHydrating) {
    return <div className="min-h-[50dvh] animate-pulse bg-[#fff9f2]" aria-busy="true" />;
  }

  if (adminOnly ? !canAccessAdminRoute(session) : !session) {
    return null;
  }

  return children;
}
