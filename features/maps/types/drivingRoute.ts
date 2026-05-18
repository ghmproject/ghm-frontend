import type { LatLng } from "@/features/restaurants/types/restaurant";

export type RouteOption = {
  id: string;
  title: string;
  hint?: string;
  path: LatLng[];
  distanceKm: number;
  durationMin: number;
};

export type DrivingRoutes = {
  options: RouteOption[];
};
