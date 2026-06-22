"use client";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

import type { LatLng } from "@/features/restaurants/types/restaurant";

import { MapCoordinateMenu } from "@/features/maps/components/MapCoordinateMenu";
import { UserLocationMarkerLeaflet } from "@/features/maps/components/UserLocationMarkerLeaflet";
import { MapZoomGuard } from "@/features/maps/components/MapZoomGuard";
import type { DealMapProps } from "@/features/maps/map-types";
import { useMapCoordinateMenu } from "@/features/maps/hooks/useMapCoordinateMenu";
import { isInBrisbaneBounds, mapCameraCenter } from "@/features/maps/utils/nearBrisbane";
import { CARTO_LIGHT_TILES } from "@/lib/maps/leafletTiles";
import {
  BRISBANE_MAX_BOUNDS,
  DEFAULT_MAP_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
} from "@/lib/maps/googleMaps";
import { formatPriceCompact } from "@/lib/utils/formatCurrency";

import "leaflet/dist/leaflet.css";

const ACCENT = "#FF5722";
function priceTeardropIcon(
  restaurant: DealMapProps["restaurants"][number],
  selected: boolean,
  simpleMapPins: boolean,
): L.DivIcon {
  const label = formatPriceCompact(restaurant.price);
  const featuredPin = Boolean(restaurant.isFeatured) && !simpleMapPins;
  const hot = restaurant.isHotDeal && !selected && !featuredPin;

  const fill = featuredPin ? "#171717" : selected ? "#E53935" : ACCENT;
  const stroke = featuredPin ? "rgba(251,191,36,0.95)" : selected ? "rgba(185,28,28,0.35)" : "rgba(0,0,0,0.06)";
  const strokeW = featuredPin ? 2 : selected ? 1 : 1;
  const textColor = featuredPin ? "#facc15" : "#ffffff";
  const hotGlow = hot ? "0 0 16px 3px rgba(239,68,68,0.45), " : "";
  const selectGlow = selected
    ? featuredPin
      ? "0 0 0 3px rgba(253,224,71,0.45), 0 0 20px rgba(251,191,36,0.28), "
      : "0 0 0 4px rgba(248,113,113,0.7), 0 0 22px rgba(239,68,68,0.42), "
    : "";
  const baseSh = "0 4px 12px rgba(0,0,0,0.28)";
  const scale = selected ? "scale(1.06)" : "scale(1)";

  const crown = featuredPin
    ? `<span style="position:absolute;left:50%;top:-32px;transform:translateX(-50%);line-height:0;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.35))"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="36" height="36" fill="#facc15" aria-hidden="true"><path d="M528 448H112c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h416c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm64-320c-26.5 0-48 21.5-48 48 0 7.1 1.6 13.7 4.4 19.8L476 239.2c-15.4 9.2-35.3 4-44.2-11.6L350.3 85C361 76.2 368 63 368 48c0-26.5-21.5-48-48-48s-48 21.5-48 48c0 15 7 28.2 17.7 37l-81.5 142.6c-8.9 15.6-28.9 20.8-44.2 11.6l-72.3-43.4c2.7-6 4.4-12.7 4.4-19.8 0-26.5-21.5-48-48-48S0 149.5 0 176s21.5 48 48 48c2.6 0 5.2-.4 7.7-.8L128 416h384l72.3-192.8c2.5.4 5.1.8 7.7.8 26.5 0 48-21.5 48-48s-21.5-48-48-48z"/></svg></span>`
    : "";

  const html = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:${scale};filter:drop-shadow(0 2px 2px rgba(0,0,0,0.12))">
      ${crown}
      <div style="
        position:relative;
        background:${fill};
        color:${textColor};
        font-weight:800;
        font-size:13px;
        letter-spacing:-0.02em;
        padding:7px 12px 8px;
        border-radius:18px;
        border:${strokeW}px solid ${stroke};
        box-shadow:${selectGlow}${hotGlow}${baseSh};
      ">${label}</div>
      <div style="
        width:0;height:0;
        margin-top:-2px;
        border-left:9px solid transparent;
        border-right:9px solid transparent;
        border-top:11px solid ${fill};
        filter:drop-shadow(0 3px 2px rgba(0,0,0,0.15));
      "></div>
    </div>`;

  return L.divIcon({
    html,
    className: "ghm-leaflet-marker",
    iconSize: featuredPin ? [56, 78] : [52, 62],
    iconAnchor: featuredPin ? [28, 72] : [26, 58],
  });
}

function MapCoordinateLayer({
  onOpen,
}: {
  onOpen: (clientX: number, clientY: number, lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const onContextMenu = (e: L.LeafletMouseEvent) => {
      e.originalEvent.preventDefault();
      onOpen(e.originalEvent.clientX, e.originalEvent.clientY, e.latlng.lat, e.latlng.lng);
    };
    map.on("contextmenu", onContextMenu);
    return () => {
      map.off("contextmenu", onContextMenu);
    };
  }, [map, onOpen]);

  return null;
}

function MapFlyTo({ target }: { target: LatLng | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !target) return;
    const z = Math.min(Math.max(map.getZoom(), 15), MAP_MAX_ZOOM);
    map.setView([target.lat, target.lng], z, { animate: true });
  }, [map, target?.lat, target?.lng]);
  return null;
}

function MapBackgroundClick({ onMapClick }: { onMapClick?: () => void }) {
  useMapEvents({
    click() {
      onMapClick?.();
    },
  });
  return null;
}

export function DealMapLeaflet({
  restaurants,
  userCoords,
  selectedId,
  onSelect,
  flyTo,
  onMapClick,
  simpleMapPins = false,
}: DealMapProps) {
  const mapCenter = mapCameraCenter(userCoords);
  const center: [number, number] = [mapCenter.lat, mapCenter.lng];
  const { menu: coordMenu, openAt, openFromEvent, close: closeCoordMenu } = useMapCoordinateMenu();

  const showGpsPin = userCoords != null && isInBrisbaneBounds(userCoords);

  const icons = useMemo(() => {
    const m = new Map<string, L.DivIcon>();
    for (const r of restaurants) {
      m.set(r.id, priceTeardropIcon(r, r.id === selectedId, simpleMapPins));
    }
    return m;
  }, [restaurants, selectedId, simpleMapPins]);

  return (
    <div className="relative z-0 flex h-full min-h-0 w-full flex-col bg-[#dcd9d4]">
      <MapContainer
        center={center}
        zoom={DEFAULT_MAP_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        zoomSnap={1}
        zoomDelta={1}
        maxBounds={BRISBANE_MAX_BOUNDS}
        maxBoundsViscosity={1}
        className="ghm-leaflet-map z-0 h-full w-full min-h-0 flex-1 rounded-none [&_.leaflet-control-attribution]:rounded-lg [&_.leaflet-control-attribution]:border-0 [&_.leaflet-control-attribution]:bg-white/80 [&_.leaflet-control-attribution]:text-[9px] [&_.leaflet-control-attribution]:shadow-sm [&_.leaflet-control-attribution]:backdrop-blur-sm [&_.leaflet-control-attribution_a]:text-neutral-500"
        scrollWheelZoom
        zoomControl={false}
      >
        <TileLayer
          attribution={CARTO_LIGHT_TILES.attribution}
          url={CARTO_LIGHT_TILES.url}
          subdomains={CARTO_LIGHT_TILES.subdomains}
          maxZoom={CARTO_LIGHT_TILES.maxZoom}
          maxNativeZoom={CARTO_LIGHT_TILES.maxNativeZoom}
          tileSize={512}
          zoomOffset={-1}
          updateWhenZooming={false}
          updateWhenIdle
        />
        <MapZoomGuard />
        <MapFlyTo target={flyTo} />
        <MapBackgroundClick onMapClick={onMapClick} />
        <MapCoordinateLayer onOpen={openAt} />
        {showGpsPin && userCoords && (
          <UserLocationMarkerLeaflet
            coords={userCoords}
            onMapContextMenu={(e) => {
              openFromEvent(e.originalEvent, userCoords.lat, userCoords.lng);
            }}
          />
        )}
        {restaurants.map((r) => {
          return (
            <Marker
              key={`${r.id}-${selectedId === r.id ? "1" : "0"}`}
              position={[r.position.lat, r.position.lng]}
              icon={icons.get(r.id) ?? priceTeardropIcon(r, selectedId === r.id, simpleMapPins)}
              eventHandlers={{ click: () => onSelect(r.id) }}
              zIndexOffset={
                selectedId === r.id ? 800 : r.isFeatured && !simpleMapPins ? 400 : 0
              }
            />
          );
        })}
      </MapContainer>
      <MapCoordinateMenu menu={coordMenu} onClose={closeCoordMenu} />
    </div>
  );
}
