"use client";

import { useCallback, useEffect, useState } from "react";

import type { LatLng } from "@/features/restaurants/types/restaurant";

type UserLocationState =
  | { status: "idle" | "loading" }
  | { status: "ready"; coords: LatLng }
  | { status: "denied" | "unavailable"; message: string };

/** Requests GPS on map load when permission is prompt/granted. Map uses a hub fallback until ready. */
export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({ status: "idle" });

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unavailable", message: "Geolocation not supported" });
      return;
    }
    setState({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: "ready",
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied"
            : "Could not read your location";
        setState({ status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable", message });
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 12_000 },
    );
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let cancelled = false;

    const syncFromPermission = (permissionState: PermissionState) => {
      if (cancelled) return;
      if (permissionState === "granted" || permissionState === "prompt") {
        request();
        return;
      }
      setState({
        status: "denied",
        message: "Location permission denied",
      });
    };

    const init = async () => {
      try {
        const perm = await navigator.permissions.query({ name: "geolocation" });
        if (cancelled) return;
        syncFromPermission(perm.state);
        perm.onchange = () => syncFromPermission(perm.state);
      } catch {
        if (!cancelled) request();
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [request]);

  const coords = state.status === "ready" ? state.coords : null;

  return { state, coords, refresh: request };
}
