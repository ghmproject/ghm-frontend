"use client";

import type { RouteOption } from "@/features/maps/types/drivingRoute";
import type { LatLng } from "@/features/restaurants/types/restaurant";

type MapDrivingRouteLeafletProps = {
  options: RouteOption[];
  selectedIndex: number;
  origin?: LatLng | null;
  destination?: LatLng | null;
};

/** Route lines hidden — distance/time still shown on restaurant cards. */
export function MapDrivingRouteLeaflet(_props: MapDrivingRouteLeafletProps) {
  return null;
}
