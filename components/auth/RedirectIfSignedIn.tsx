"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { routes } from "@/config/routes";
import { getStoredSession } from "@/lib/auth/clientSessionStorage";
import { canAccessAdminRoute } from "@/lib/auth/redirects";

export function RedirectIfSignedIn({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const session = getStoredSession();
    if (!session) return;
    const dest = canAccessAdminRoute(session) ? routes.submissions : routes.map;
    router.replace(dest);
  }, [router]);

  return children;
}
