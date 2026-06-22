"use client";

import { useEffect, useRef } from "react";

import { probeBackendSession } from "@/api/routes/auth.api";
import {
  needsBackendSessionSync,
  syncSessionFromBackend,
} from "@/features/auth/actions/auth";
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
        const shouldProbe = await needsBackendSessionSync();
        if (!shouldProbe) return;

        const backend = await probeBackendSession();
        if (!backend) return;

        const synced = await syncSessionFromBackend(backend.role);
        if (synced) {
          await refreshSession();
        }
      } catch {
        // Server action or sync failed — ignore on public pages.
      }
    })();
  }, [refreshSession]);

  return null;
}
