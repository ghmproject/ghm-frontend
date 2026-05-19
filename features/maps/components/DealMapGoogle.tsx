"use client";

import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { Crown } from "lucide-react";
import { useEffect, useMemo } from "react";

import { env } from "@/config/env";
import { MapCoordinateMenu } from "@/features/maps/components/MapCoordinateMenu";
import { MapDrivingRouteGoogle } from "@/features/maps/components/MapDrivingRouteGoogle";
import { MapRoutePicker } from "@/features/maps/components/MapRoutePicker";
import { MapFitRouteBoundsGoogle } from "@/features/maps/components/MapFitRouteBoundsGoogle";
import { RouteYouMarkerGoogle } from "@/features/maps/components/RouteYouMarkerGoogle";
import { UserLocationMarkerGoogle } from "@/features/maps/components/UserLocationMarkerGoogle";
import type { DealMapProps } from "@/features/maps/map-types";
import { useMapCoordinateMenu } from "@/features/maps/hooks/useMapCoordinateMenu";
import { useRouteSelection } from "@/features/maps/hooks/useRouteSelection";
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
  showRouteLabels,
  onSelect,
}: {
  restaurant: DealMapProps["restaurants"][number];
  selected: boolean;
  showRouteLabels: boolean;
  onSelect: DealMapProps["onSelect"];
}) {
  const { price, isHotDeal, isTopRated, id } = restaurant;
  const label = formatPriceCompact(price);

  const tailFill = isTopRated ? "#171717" : selected ? "#E53935" : "#FF5722";

  return (
    <AdvancedMarker
      position={restaurant.position}
      onClick={() => onSelect(id)}
      zIndex={selected ? 50 : isTopRated ? 20 : 10}
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
        {isTopRated && (
          <Crown
            className="absolute -top-4 z-[2] h-[18px] w-[18px] text-amber-400 drop-shadow"
            strokeWidth={2.2}
            aria-hidden
          />
        )}
        {selected && showRouteLabels && (
          <span className="absolute -top-7 z-[2] whitespace-nowrap rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
            Restaurant
          </span>
        )}
        <div
          className={cn(
            "relative z-[1] px-2.5 pb-1.5 pt-1.5 text-[13px] font-extrabold leading-none text-white",
            isTopRated
              ? "rounded-[18px] border-2 border-amber-400/90 bg-neutral-900"
              : selected
                ? "rounded-[18px] border border-red-700/25 bg-[#E53935] shadow-[0_0_0_3px_rgba(255,255,255,0.35)]"
                : "rounded-[18px] border border-black/[0.06] bg-[#FF5722]",
            isHotDeal && !selected && "shadow-[0_0_18px_rgba(239,68,68,0.5)]",
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
  routeFrom,
  onMapClick,
}: DealMapProps) {
  const center = mapCameraCenter(userCoords);
  const mapId = env.googleMapId.trim() || undefined;
  const { menu: coordMenu, openAt, openFromEvent, close: closeCoordMenu } = useMapCoordinateMenu();

  const routeTo = useMemo(() => {
    if (!selectedId) return null;
    return restaurants.find((r) => r.id === selectedId)?.position ?? null;
  }, [restaurants, selectedId]);

  const { options: routeOptions, selectedIndex, setSelectedIndex } = useRouteSelection(
    routeFrom,
    routeTo,
  );

  const routeActive = routeFrom != null && routeTo != null && routeOptions.length > 0;

  const showGpsPin =
    userCoords != null &&
    isInBrisbaneBounds(userCoords) &&
    !routeActive;

  const showRouteYou = routeActive && routeFrom != null;

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
        {!routeActive && <MapFlyToSearch target={flyTo ?? null} />}
        <RecenterOnUser coords={userCoords} flyTo={flyTo} />
        <MapBackgroundClick onMapClick={onMapClick} />
        <MapCoordinateLayer onOpen={openAt} />
        <MapDrivingRouteGoogle
          options={routeOptions}
          selectedIndex={selectedIndex}
          origin={routeFrom}
          destination={routeTo}
        />
        {routeActive && (
          <MapFitRouteBoundsGoogle
            origin={routeFrom}
            destination={routeTo}
            options={routeOptions}
            selectedIndex={selectedIndex}
          />
        )}
        {showRouteYou && routeFrom && (
          <RouteYouMarkerGoogle
            coords={routeFrom}
            onContextMenu={(e) => openFromEvent(e, routeFrom.lat, routeFrom.lng)}
          />
        )}
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
              showRouteLabels={routeActive && selected}
              onSelect={onSelect}
            />
          );
        })}
      </Map>
      <MapCoordinateMenu menu={coordMenu} onClose={closeCoordMenu} />
    </APIProvider>
    {routeOptions.length > 0 && (
      <MapRoutePicker
        options={routeOptions}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
      />
    )}
    </div>
  );
}
