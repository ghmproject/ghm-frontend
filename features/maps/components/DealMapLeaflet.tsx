"use client";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

import type { LatLng } from "@/features/restaurants/types/restaurant";

import { MapCoordinateMenu } from "@/features/maps/components/MapCoordinateMenu";
import { MapFitRouteBoundsLeaflet } from "@/features/maps/components/MapFitRouteBoundsLeaflet";
import { MapDrivingRouteLeaflet } from "@/features/maps/components/MapDrivingRouteLeaflet";
import { MapRoutePicker } from "@/features/maps/components/MapRoutePicker";
import { UserLocationMarkerLeaflet } from "@/features/maps/components/UserLocationMarkerLeaflet";
import { MapZoomGuard } from "@/features/maps/components/MapZoomGuard";
import { RouteYouMarkerLeaflet } from "@/features/maps/components/RouteYouMarkerLeaflet";
import type { DealMapProps } from "@/features/maps/map-types";
import { useMapCoordinateMenu } from "@/features/maps/hooks/useMapCoordinateMenu";
import { useRouteSelection } from "@/features/maps/hooks/useRouteSelection";
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
): L.DivIcon {
  const label = formatPriceCompact(restaurant.price);
  const topRated = restaurant.isTopRated;
  const hot = restaurant.isHotDeal && !selected;

  const fill = topRated ? "#171717" : selected ? "#E53935" : ACCENT;
  const stroke = topRated ? "rgba(251,191,36,0.95)" : selected ? "rgba(185,28,28,0.35)" : "rgba(0,0,0,0.06)";
  const strokeW = topRated ? 2 : selected ? 1 : 1;
  const hotGlow = hot ? "0 0 16px 3px rgba(239,68,68,0.45), " : "";
  const selectGlow = selected
    ? topRated
      ? "0 0 0 3px rgba(253,224,71,0.45), 0 0 20px rgba(251,191,36,0.28), "
      : "0 0 0 4px rgba(248,113,113,0.7), 0 0 22px rgba(239,68,68,0.42), "
    : "";
  const baseSh = "0 4px 12px rgba(0,0,0,0.28)";
  const scale = selected ? "scale(1.06)" : "scale(1)";

  const crown = topRated
    ? `<span style="position:absolute;left:50%;top:-16px;transform:translateX(-50%);font-size:15px;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.35));line-height:1">👑</span>`
    : "";

  const html = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:${scale};filter:drop-shadow(0 2px 2px rgba(0,0,0,0.12))">
      ${crown}
      <div style="
        position:relative;
        background:${fill};
        color:#fff;
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
    iconSize: [52, 62],
    iconAnchor: [26, 58],
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
  routeFrom,
  onMapClick,
}: DealMapProps) {
  const mapCenter = mapCameraCenter(userCoords);
  const center: [number, number] = [mapCenter.lat, mapCenter.lng];
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

  const icons = useMemo(() => {
    const m = new Map<string, L.DivIcon>();
    for (const r of restaurants) {
      m.set(r.id, priceTeardropIcon(r, r.id === selectedId));
    }
    return m;
  }, [restaurants, selectedId]);

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
        {!routeActive && <MapFlyTo target={flyTo} />}
        <MapBackgroundClick onMapClick={onMapClick} />
        <MapCoordinateLayer onOpen={openAt} />
        <MapDrivingRouteLeaflet
          options={routeOptions}
          selectedIndex={selectedIndex}
          origin={routeFrom}
          destination={routeTo}
        />
        {routeActive && (
          <MapFitRouteBoundsLeaflet
            origin={routeFrom}
            destination={routeTo}
            options={routeOptions}
            selectedIndex={selectedIndex}
          />
        )}
        {showRouteYou && routeFrom && (
          <RouteYouMarkerLeaflet
            coords={routeFrom}
            onMapContextMenu={(e) => {
              openFromEvent(e.originalEvent, routeFrom.lat, routeFrom.lng);
            }}
          />
        )}
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
              icon={icons.get(r.id) ?? priceTeardropIcon(r, selectedId === r.id)}
              eventHandlers={{ click: () => onSelect(r.id) }}
              zIndexOffset={selectedId === r.id ? 800 : r.isTopRated ? 400 : 0}
            />
          );
        })}
      </MapContainer>
      {routeOptions.length > 0 && (
        <MapRoutePicker
          options={routeOptions}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      )}
      <MapCoordinateMenu menu={coordMenu} onClose={closeCoordMenu} />
    </div>
  );
}
