"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

import { ROUTE_DOT } from "@/features/maps/components/MapRouteDotGoogle";
import type { LatLng } from "@/features/restaurants/types/restaurant";

type Props = {
  coords: LatLng;
  onContextMenu: (e: React.MouseEvent) => void;
};

export function UserLocationMarkerGoogle({ coords, onContextMenu }: Props) {
  return (
    <AdvancedMarker position={coords} zIndex={8}>
      <div
        role="img"
        aria-label="Your location"
        className="flex cursor-context-menu flex-col items-center"
        onContextMenu={onContextMenu}
      >
        <MapPin
          className="h-9 w-9 drop-shadow-[0_2px_8px_rgba(0,0,0,0.28)]"
          fill={ROUTE_DOT.gps.fill}
          stroke="#ffffff"
          strokeWidth={2}
        />
      </div>
    </AdvancedMarker>
  );
}
