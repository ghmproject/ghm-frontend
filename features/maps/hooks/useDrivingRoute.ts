"use client";

import { useQuery } from "@tanstack/react-query";

import type { DrivingRoutes } from "@/features/maps/types/drivingRoute";
import type { LatLng } from "@/features/restaurants/types/restaurant";

const EMPTY_ROUTES: DrivingRoutes = { options: [] };

async function fetchDrivingRoutes(
  origin: LatLng,
  destination: LatLng,
): Promise<DrivingRoutes> {
  const res = await fetch("/api/driving-route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destination }),
  });

  if (!res.ok) return EMPTY_ROUTES;

  const json = (await res.json()) as DrivingRoutes;
  return { options: json.options ?? [] };
}

export function useDrivingRoute(
  origin: LatLng | null | undefined,
  destination: LatLng | null | undefined,
) {
  return useQuery({
    queryKey: [
      "driving-route",
      origin?.lat,
      origin?.lng,
      destination?.lat,
      destination?.lng,
    ],
    queryFn: () => fetchDrivingRoutes(origin!, destination!),
    enabled: origin != null && destination != null,
    staleTime: 5 * 60_000,
  });
}
