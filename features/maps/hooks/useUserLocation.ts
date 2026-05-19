"use client";

import { useCallback, useEffect, useState } from "react";

import type { LatLng } from "@/features/restaurants/types/restaurant";

type UserLocationState =
  | { status: "idle" | "loading" }
  | { status: "ready"; coords: LatLng }
  | { status: "denied" | "unavailable"; message: string };

/**
 * Requests GPS only when permission is already granted (no prompt on first visit).
 * Otherwise call `refresh()` after the user taps Enable location.
 */
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

    const tryGrantedLocate = async () => {
      try {
        const perm = await navigator.permissions.query({ name: "geolocation" });
        if (!cancelled && perm.state === "granted") request();
      } catch {
        /* Permissions API unavailable — user enables location manually */
      }
    };

    void tryGrantedLocate();
    return () => {
      cancelled = true;
    };
  }, [request]);

  const coords = state.status === "ready" ? state.coords : null;

  return { state, coords, refresh: request };
}
