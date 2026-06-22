"use client";

import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { FaCrown } from "react-icons/fa";
import { useEffect, useMemo } from "react";

import { env } from "@/config/env";
import { MapCoordinateMenu } from "@/features/maps/components/MapCoordinateMenu";
import { UserLocationMarkerGoogle } from "@/features/maps/components/UserLocationMarkerGoogle";
import type { DealMapProps } from "@/features/maps/map-types";
import { useMapCoordinateMenu } from "@/features/maps/hooks/useMapCoordinateMenu";
import {
  isInBrisbaneBounds,
  isNearBrisbane,
  mapCameraCenter,
} from "@/features/maps/utils/nearBrisbane";
import {
  BRISBANE_BOUNDS,
  DEFAULT_MAP_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  SILVER_MAP_STYLE,
} from "@/lib/maps/googleMaps";
import { cn } from "@/lib/utils/cn";
import { formatPriceCompact } from "@/lib/utils/formatCurrency";

function RecenterOnUser({
  coords,
  flyTo,
}: {
  coords: NonNullable<DealMapProps["userCoords"]> | null;
  flyTo: DealMapProps["flyTo"];
}) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) return;
    if (map && coords && isNearBrisbane(coords)) map.panTo(coords);
  }, [map, coords, flyTo]);
  return null;
}

function MapCoordinateLayer({
  onOpen,
}: {
  onOpen: (clientX: number, clientY: number, lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("contextmenu", (e: google.maps.MapMouseEvent) => {
      const dom = e.domEvent;
      if (!dom || !(dom instanceof MouseEvent)) return;
      dom.preventDefault();
      const latLng = e.latLng;
      if (!latLng) return;
      onOpen(dom.clientX, dom.clientY, latLng.lat(), latLng.lng());
    });
    return () => google.maps.event.removeListener(listener);
  }, [map, onOpen]);

  return null;
}

function MapBackgroundClick({ onMapClick }: { onMapClick?: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !onMapClick) return;
    const listener = map.addListener("click", () => onMapClick());
    return () => google.maps.event.removeListener(listener);
  }, [map, onMapClick]);
  return null;
}

function MapFlyToSearch({ target }: { target: google.maps.LatLngLiteral | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !target) return;
    const current = map.getZoom() ?? DEFAULT_MAP_ZOOM;
    const z = Math.min(current < 15 ? 15 : current, MAP_MAX_ZOOM);
    map.panTo(target);
    map.setZoom(z);
  }, [map, target?.lat, target?.lng]);
  return null;
}

function PriceMarker({
  restaurant,
  selected,
  simpleMapPins,
  onSelect,
}: {
  restaurant: DealMapProps["restaurants"][number];
  selected: boolean;
  simpleMapPins: boolean;
  onSelect: DealMapProps["onSelect"];
}) {
  const { price, isHotDeal, isFeatured, id } = restaurant;
  const label = formatPriceCompact(price);
  const isFeaturedPin = Boolean(isFeatured) && !simpleMapPins;

  const tailFill = isFeaturedPin ? "#171717" : selected ? "#E53935" : "#FF5722";

  return (
    <AdvancedMarker
      position={restaurant.position}
      onClick={() => onSelect(id)}
      zIndex={selected ? 50 : isFeaturedPin ? 25 : 10}
    >
      <div
        className={cn(
          "relative flex flex-col items-center drop-shadow-md transition-transform",
          selected && "scale-105",
        )}
      >
        {selected && (
          <span
            className="pointer-events-none absolute left-1/2 top-[42%] z-0 h-[4.25rem] w-[4.25rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/30 blur-2xl"
            aria-hidden
          />
        )}
        {isFeaturedPin && (
          <FaCrown
            className="absolute -top-8 z-[2] h-9 w-9 text-amber-400 drop-shadow"
            aria-hidden
          />
        )}
        <div
          className={cn(
            "relative z-[1] px-2.5 pb-1.5 pt-1.5 text-[13px] font-extrabold leading-none",
            isFeaturedPin
              ? "rounded-[18px] border-2 border-amber-400 bg-neutral-900 text-amber-400"
              : selected
                ? "rounded-[18px] border border-red-700/25 bg-[#E53935] text-white shadow-[0_0_0_3px_rgba(255,255,255,0.35)]"
                : "rounded-[18px] border border-black/[0.06] bg-[#FF5722] text-white",
            isHotDeal && !selected && !isFeaturedPin && "shadow-[0_0_18px_rgba(239,68,68,0.5)]",
          )}
        >
          {label}
        </div>
        <div
          className="z-0 -mt-0.5 h-0 w-0 border-x-[9px] border-x-transparent border-t-[11px] border-t-solid"
          style={{ borderTopColor: tailFill }}
        />
      </div>
    </AdvancedMarker>
  );
}

export function DealMapGoogle({
  restaurants,
  userCoords,
  selectedId,
  onSelect,
  flyTo,
  onMapClick,
  simpleMapPins = false,
}: DealMapProps) {
  const center = mapCameraCenter(userCoords);
  const mapId = env.googleMapId.trim() || undefined;
  const { menu: coordMenu, openAt, openFromEvent, close: closeCoordMenu } = useMapCoordinateMenu();

  const showGpsPin = userCoords != null && isInBrisbaneBounds(userCoords);

  return (
    <div className="relative h-full w-full min-h-0">
    <APIProvider apiKey={env.googleMapsApiKey} libraries={["marker"]}>
      <Map
        className="h-full w-full min-h-0"
        defaultCenter={center}
        defaultZoom={DEFAULT_MAP_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        restriction={{
          latLngBounds: BRISBANE_BOUNDS,
          strictBounds: true,
        }}
        gestureHandling="greedy"
        disableDefaultUI
        styles={SILVER_MAP_STYLE}
        mapId={mapId}
        colorScheme="LIGHT"
      >
        <MapFlyToSearch target={flyTo ?? null} />
        <RecenterOnUser coords={userCoords} flyTo={flyTo} />
        <MapBackgroundClick onMapClick={onMapClick} />
        <MapCoordinateLayer onOpen={openAt} />
        {showGpsPin && userCoords && (
          <UserLocationMarkerGoogle
            coords={userCoords}
            onContextMenu={(e) => openFromEvent(e, userCoords.lat, userCoords.lng)}
          />
        )}
        {restaurants.map((r) => {
          const selected = r.id === selectedId;
          return (
            <PriceMarker
              key={r.id}
              restaurant={r}
              selected={selected}
              simpleMapPins={simpleMapPins}
              onSelect={onSelect}
            />
          );
        })}
      </Map>
      <MapCoordinateMenu menu={coordMenu} onClose={closeCoordMenu} />
    </APIProvider>
    </div>
  );
}
