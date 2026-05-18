"use client";

import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

import type { RouteOption } from "@/features/maps/types/drivingRoute";
import {
  ROUTE_SELECTED_COLOR,
  ROUTE_SELECTED_WEIGHT,
  ROUTE_UNSELECTED_COLOR,
  ROUTE_UNSELECTED_WEIGHT,
} from "@/lib/maps/routeStyles";

type MapDrivingRouteGoogleProps = {
  options: RouteOption[];
  selectedIndex: number;
};

export function MapDrivingRouteGoogle({ options, selectedIndex }: MapDrivingRouteGoogleProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !options.length) return;

    const lines: google.maps.Polyline[] = [];

    options.forEach((opt, i) => {
      if (!opt.path.length) return;
      const selected = i === selectedIndex;
      const line = new google.maps.Polyline({
        path: opt.path,
        strokeColor: selected ? ROUTE_SELECTED_COLOR : ROUTE_UNSELECTED_COLOR,
        strokeOpacity: selected ? 1 : 0.85,
        strokeWeight: selected ? ROUTE_SELECTED_WEIGHT : ROUTE_UNSELECTED_WEIGHT,
        zIndex: selected ? 2 : 1,
      });
      line.setMap(map);
      lines.push(line);
    });

    return () => {
      for (const line of lines) line.setMap(null);
    };
  }, [map, options, selectedIndex]);

  return null;
}
