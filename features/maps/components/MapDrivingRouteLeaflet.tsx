"use client";

import { Polyline } from "react-leaflet";

import type { RouteOption } from "@/features/maps/types/drivingRoute";
import type { LatLng } from "@/features/restaurants/types/restaurant";
import {
  ROUTE_SELECTED_COLOR,
  ROUTE_SELECTED_WEIGHT,
  ROUTE_UNSELECTED_COLOR,
  ROUTE_UNSELECTED_WEIGHT,
} from "@/lib/maps/routeStyles";

type MapDrivingRouteLeafletProps = {
  options: RouteOption[];
  selectedIndex: number;
};

function toPositions(path: LatLng[]): [number, number][] {
  return path.map((p) => [p.lat, p.lng]);
}

export function MapDrivingRouteLeaflet({
  options,
  selectedIndex,
}: MapDrivingRouteLeafletProps) {
  if (!options.length) return null;

  return (
    <>
      {options.map((opt, i) => {
        if (!opt.path.length) return null;
        const selected = i === selectedIndex;
        return (
          <Polyline
            key={opt.id}
            positions={toPositions(opt.path)}
            pathOptions={{
              color: selected ? ROUTE_SELECTED_COLOR : ROUTE_UNSELECTED_COLOR,
              weight: selected ? ROUTE_SELECTED_WEIGHT : ROUTE_UNSELECTED_WEIGHT,
              opacity: selected ? 1 : 0.85,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        );
      })}
    </>
  );
}
