"use client";

import { useMap } from "react-leaflet";
import { useEffect } from "react";

import { MAP_MAX_ZOOM } from "@/lib/maps/googleMaps";

/** Hard-stop zoom past tile limit so the map never shows a blank grey pane. */
export function MapZoomGuard() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const clamp = () => {
      const z = map.getZoom();
      if (z > MAP_MAX_ZOOM) {
        map.setZoom(MAP_MAX_ZOOM, { animate: false });
      }
    };

    clamp();
    map.on("zoom", clamp);
    map.on("zoomend", clamp);

    return () => {
      map.off("zoom", clamp);
      map.off("zoomend", clamp);
    };
  }, [map]);

  return null;
}
