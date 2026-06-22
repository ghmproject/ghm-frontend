"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { logoutBackend } from "@/api/routes/auth.api";
import { routes } from "@/config/routes";
import { clearLocalSession } from "@/features/auth/actions/auth";
import { clearBackendAccessToken } from "@/lib/auth/backendAccessToken";
import { useAuth } from "@/providers/AuthProvider";

export function useSignOut() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [pending, setPending] = useState(false);

  const signOut = useCallback(async () => {
    setPending(true);
    try {
      await logoutBackend().catch(() => undefined);
      clearBackendAccessToken();
      await clearLocalSession();
      await refreshSession();
      router.push(routes.login);
    } finally {
      setPending(false);
    }
  }, [router, refreshSession]);

  return { signOut, pending };
}
