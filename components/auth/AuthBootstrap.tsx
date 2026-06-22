"use client";

import { useEffect, useRef } from "react";

import { probeBackendSession } from "@/api/routes/auth.api";
import {
  fetchAuthBootstrap,
  syncSessionFromBackendClient,
} from "@/lib/auth/clientAuthApi";
import { useAuth } from "@/providers/AuthProvider";

/**
 * After the user opens the magic link on the API host, `ghm_token` lives on the backend origin.
 * This probe syncs `ghm_session` on the frontend when a pending email cookie is present.
 */
export function AuthBootstrap() {
  const { refreshSession } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      try {
        const { pendingSync } = await fetchAuthBootstrap();
        if (!pendingSync) return;

        const backend = await probeBackendSession();
        if (!backend) return;

        const synced = await syncSessionFromBackendClient(backend.role);
        if (synced) {
          await refreshSession();
        }
      } catch {
        // API or sync failed — ignore on public pages.
      }
    })();
  }, [refreshSession]);

  return null;
}
