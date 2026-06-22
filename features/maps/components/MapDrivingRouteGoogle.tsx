"use client";

import type { RouteOption } from "@/features/maps/types/drivingRoute";
import type { LatLng } from "@/features/restaurants/types/restaurant";

type MapDrivingRouteGoogleProps = {
  options: RouteOption[];
  selectedIndex: number;
  origin?: LatLng | null;
  destination?: LatLng | null;
};

/** Route lines hidden — distance/time still shown on restaurant cards. */
export function MapDrivingRouteGoogle(_props: MapDrivingRouteGoogleProps) {
  return null;
}
