"use client";

import L from "leaflet";
import { Marker } from "react-leaflet";

import { ROUTE_DOT } from "@/features/maps/components/MapRouteDotGoogle";
import type { LatLng } from "@/features/restaurants/types/restaurant";

const GPS_FILL = ROUTE_DOT.gps.fill;

const leafletGpsPinIcon = L.divIcon({
  className: "ghm-gps-location-pin",
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
      fill="${GPS_FILL}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.28))">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
      <circle cx="12" cy="10" r="3" fill="#ffffff" stroke="${GPS_FILL}" stroke-width="1.5"/>
    </svg>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

export function UserLocationMarkerLeaflet({
  coords,
  onMapContextMenu,
}: {
  coords: LatLng;
  onMapContextMenu?: (e: L.LeafletMouseEvent) => void;
}) {
  return (
    <Marker
      position={[coords.lat, coords.lng]}
      icon={leafletGpsPinIcon}
      zIndexOffset={700}
      eventHandlers={
        onMapContextMenu
          ? {
              contextmenu: (e: L.LeafletMouseEvent) => {
                onMapContextMenu(e);
                L.DomEvent.stopPropagation(e);
              },
            }
          : undefined
      }
    />
  );
}
