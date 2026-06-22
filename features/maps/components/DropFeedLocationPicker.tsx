"use client";

import { MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";

import type { LatLng } from "@/features/restaurants/types/restaurant";
import { nearbySearchConfig } from "@/config/nearbySearch";
import {
  BRISBANE_MAX_BOUNDS,
  DEFAULT_MAP_CENTER,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
} from "@/lib/maps/googleMaps";
import { CARTO_LIGHT_TILES } from "@/lib/maps/leafletTiles";
import { MAPS_API_PATH } from "@/lib/maps/mapsApi";
import { cn } from "@/lib/utils/cn";

import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);

const ACCENT = "#FF5722";
const LOADER_MIN_MS = 1000;
const MOVE_END_DEBOUNCE_MS = 400;

export type DropFeedReverseGeocodeResult = {
  address: string;
  suburb: string;
  lat: number;
  lng: number;
};

type DropFeedLocationPickerProps = {
  open: boolean;
  pin: LatLng | null;
  onPinChange: (coords: LatLng, resolved: DropFeedReverseGeocodeResult) => void;
  className?: string;
};

async function reverseGeocodePin(
  lat: number,
  lng: number,
): Promise<DropFeedReverseGeocodeResult> {
  const res = await fetch(
    `${MAPS_API_PATH}?action=reverse-geocode&lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
  );
  const data = (await res.json()) as {
    success?: boolean;
    message?: string;
    address?: string;
    suburb?: string;
    lat?: number;
    lng?: number;
  };
  if (!res.ok || !data.success || !data.address) {
    throw new Error(data.message ?? "Could not resolve address for this pin.");
  }
  return {
    address: data.address,
    suburb: data.suburb ?? "",
    lat: data.lat ?? lat,
    lng: data.lng ?? lng,
  };
}

function FlyToInitial({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  const applied = useRef(false);
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    map.setView([center.lat, center.lng], zoom, { animate: false });
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

function CenterPinGeocoder({
  onResolved,
  onError,
  onResolvingChange,
}: {
  onResolved: (coords: LatLng, resolved: DropFeedReverseGeocodeResult) => void;
  onError: (message: string | null) => void;
  onResolvingChange: (active: boolean) => void;
}) {
  const map = useMap();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);

  const resolveCenter = useCallback(async () => {
    const runId = ++runIdRef.current;
    onResolvingChange(true);
    onError(null);
    const started = Date.now();

    try {
      const c = map.getCenter();
      const resolved = await reverseGeocodePin(c.lat, c.lng);
      const waitMs = Math.max(0, LOADER_MIN_MS - (Date.now() - started));
      if (waitMs > 0) {
        await new Promise((r) => setTimeout(r, waitMs));
      }
      if (runId !== runIdRef.current) return;
      onResolved({ lat: c.lat, lng: c.lng }, resolved);
    } catch (err) {
      if (runId !== runIdRef.current) return;
      onError(
        err instanceof Error ? err.message : "Could not load address for this pin.",
      );
    } finally {
      if (runId === runIdRef.current) {
        onResolvingChange(false);
      }
    }
  }, [map, onResolved, onError, onResolvingChange]);

  const scheduleResolve = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void resolveCenter();
    }, MOVE_END_DEBOUNCE_MS);
  }, [resolveCenter]);

  useMapEvents({
    moveend: scheduleResolve,
    dragend: scheduleResolve,
    zoomend: scheduleResolve,
  });

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      runIdRef.current += 1;
    },
    [],
  );

  return null;
}

export function DropFeedLocationPicker({
  open,
  pin,
  onPinChange,
  className,
}: DropFeedLocationPickerProps) {
  const [mapCenter, setMapCenter] = useState<LatLng>(DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(14);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (pin) {
      setMapCenter(pin);
      setMapZoom(16);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setMapCenter(nearbySearchConfig.listingsHub);
      setMapZoom(13);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setMapZoom(14);
      },
      () => {
        setMapCenter(nearbySearchConfig.listingsHub);
        setMapZoom(13);
      },
      { enableHighAccuracy: false, maximumAge: 120_000, timeout: 8_000 },
    );
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-orange-200/80 bg-orange-50/50",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-orange-200/60 px-3 py-2 text-xs text-neutral-600">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF5722]" aria-hidden />
        <span>
          {resolving
            ? "Finding address…"
            : "Move and zoom the map — the pin marks your restaurant"}
        </span>
      </div>
      <div className="relative h-[12.5rem] w-full sm:h-[14rem]">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={mapZoom}
          className="h-full w-full"
          scrollWheelZoom
          attributionControl={false}
          maxBounds={BRISBANE_MAX_BOUNDS}
          maxBoundsViscosity={1}
          minZoom={MAP_MIN_ZOOM}
          maxZoom={MAP_MAX_ZOOM}
        >
          <TileLayer
            url={CARTO_LIGHT_TILES.url}
            attribution={CARTO_LIGHT_TILES.attribution}
            subdomains={CARTO_LIGHT_TILES.subdomains}
            maxZoom={CARTO_LIGHT_TILES.maxZoom}
            maxNativeZoom={CARTO_LIGHT_TILES.maxNativeZoom}
          />
          <FlyToInitial center={mapCenter} zoom={mapZoom} />
          <CenterPinGeocoder
            onResolved={onPinChange}
            onError={setResolveError}
            onResolvingChange={setResolving}
          />
        </MapContainer>

        {/* Fixed center pin (Google Maps style) */}
        <div
          className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center"
          aria-hidden
        >
          <div className="relative -mt-8 flex flex-col items-center">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-md"
              style={{ backgroundColor: ACCENT }}
            >
              <MapPin className="h-5 w-5 text-white" strokeWidth={2.2} fill="white" />
            </div>
            <div
              className="h-3 w-0.5 rounded-full"
              style={{ backgroundColor: ACCENT }}
            />
            <div
              className="h-2 w-2 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: ACCENT }}
            />
          </div>
        </div>

        {resolving ? (
          <div
            className="absolute inset-0 z-[500] flex items-center justify-center bg-white/55 backdrop-blur-[1px]"
            aria-live="polite"
            aria-busy="true"
          >
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-t-[#FF5722]"
              role="status"
              aria-label="Loading address"
            />
          </div>
        ) : null}
      </div>
      {resolveError ? (
        <p className="px-3 py-2 text-xs font-medium text-red-600" role="alert">
          {resolveError}
        </p>
      ) : null}
    </div>
  );
}
