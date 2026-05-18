"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

import type { LatLng } from "@/features/restaurants/types/restaurant";

type UserLocationMarkerProps = {
  coords: LatLng;
  onContextMenu: (e: React.MouseEvent) => void;
};

export function UserLocationMarkerGoogle({ coords, onContextMenu }: UserLocationMarkerProps) {
  return (
    <AdvancedMarker position={coords} zIndex={6}>
      <div
        role="img"
        aria-label="Your location — right-click to copy coordinates"
        className="flex cursor-context-menu flex-col items-center"
        onContextMenu={onContextMenu}
      >
        <MapPin
          className="h-9 w-9 drop-shadow-[0_2px_6px_rgba(0,0,0,0.28)]"
          fill="#E65100"
          stroke="#ffffff"
          strokeWidth={2}
        />
      </div>
    </AdvancedMarker>
  );
}
