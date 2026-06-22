"use client";

import { useQuery } from "@tanstack/react-query";

import type { LatLng, Restaurant } from "@/features/restaurants/types/restaurant";
import { MAPS_API_PATH } from "@/lib/maps/mapsApi";

async function fetchDrivingDistances(
  origin: LatLng,
  restaurants: Restaurant[],
): Promise<Record<string, number>> {
  if (restaurants.length === 0) return {};

  const res = await fetch(MAPS_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "driving-distances",
      origin,
      destinations: restaurants.map((r) => ({
        id: r.id,
        lat: r.position.lat,
        lng: r.position.lng,
      })),
    }),
  });

  if (!res.ok) return {};

  const json = (await res.json()) as { distances?: Record<string, number> };
  return json.distances ?? {};
}

export function useDrivingDistances(
  origin: LatLng | null,
  restaurants: Restaurant[],
  options?: { enabled?: boolean },
) {
  const destKey = restaurants.map((r) => r.id).join(",");
  const enabled =
    (options?.enabled ?? true) && origin != null && restaurants.length > 0;

  const query = useQuery({
    queryKey: ["driving-distances", origin?.lat, origin?.lng, destKey],
    queryFn: () => fetchDrivingDistances(origin!, restaurants),
    enabled,
    staleTime: 5 * 60_000,
  });

  return {
    drivingKmById: query.data ?? {},
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
