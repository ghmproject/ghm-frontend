import { NextResponse } from "next/server";

import { env } from "@/config/env";
import type { DrivingRoutes, RouteOption } from "@/features/maps/types/drivingRoute";
import { decodeGooglePolyline } from "@/features/maps/utils/decodePolyline";
import type { LatLng } from "@/features/restaurants/types/restaurant";

const OSRM_BASE = "https://router.project-osrm.org";

type RawRoute = {
  path: LatLng[];
  distanceKm: number;
  durationMin: number;
};

function isValidCoord(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function geoJsonToPath(coordinates: [number, number][]): LatLng[] {
  return coordinates.map(([lng, lat]) => ({ lat, lng }));
}

function toDrivingRoutes(raw: RawRoute[]): DrivingRoutes {
  const sorted = [...raw].sort(
    (a, b) => a.durationMin - b.durationMin || a.distanceKm - b.distanceKm,
  );

  const options: RouteOption[] = sorted.map((r, i) => ({
    id: `route-${i}`,
    title: i === 0 ? "Fastest route" : "Alternate route",
    hint: i > 0 ? "You can also go this way" : undefined,
    path: r.path,
    distanceKm: r.distanceKm,
    durationMin: r.durationMin,
  }));

  return { options };
}

function googleRouteMetrics(route: {
  legs?: { distance?: { value?: number }; duration?: { value?: number } }[];
}): { distanceKm: number; durationMin: number } {
  let meters = 0;
  let seconds = 0;
  for (const leg of route.legs ?? []) {
    meters += leg.distance?.value ?? 0;
    seconds += leg.duration?.value ?? 0;
  }
  return {
    distanceKm: meters / 1000,
    durationMin: Math.max(1, Math.round(seconds / 60)),
  };
}

async function googleRoutes(
  origin: LatLng,
  destination: LatLng,
): Promise<DrivingRoutes | null> {
  const key = env.googleMapsApiKey.trim();
  if (!key) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
  url.searchParams.set("destination", `${destination.lat},${destination.lng}`);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("alternatives", "true");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    status?: string;
    routes?: {
      overview_polyline?: { points?: string };
      legs?: { distance?: { value?: number }; duration?: { value?: number } }[];
    }[];
  };

  if (json.status !== "OK" || !json.routes?.length) return null;

  const raw: RawRoute[] = [];

  for (const route of json.routes) {
    const encoded = route.overview_polyline?.points;
    if (!encoded) continue;
    const path = decodeGooglePolyline(encoded);
    if (!path.length) continue;
    const metrics = googleRouteMetrics(route);
    raw.push({ path, ...metrics });
  }

  if (!raw.length) return null;
  return toDrivingRoutes(raw);
}

async function osrmRoutes(origin: LatLng, destination: LatLng): Promise<DrivingRoutes | null> {
  const coordStr = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_BASE}/route/v1/driving/${coordStr}?overview=full&geometries=geojson&alternatives=true`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    code?: string;
    routes?: {
      distance?: number;
      duration?: number;
      geometry?: { coordinates?: [number, number][] };
    }[];
  };

  if (json.code !== "Ok" || !json.routes?.length) return null;

  const raw: RawRoute[] = [];

  for (const route of json.routes) {
    const coords = route.geometry?.coordinates;
    if (!coords?.length) continue;
    raw.push({
      path: geoJsonToPath(coords),
      distanceKm: (route.distance ?? 0) / 1000,
      durationMin: Math.max(1, Math.round((route.duration ?? 0) / 60)),
    });
  }

  if (!raw.length) return null;
  return toDrivingRoutes(raw);
}

export async function handleDrivingRoute(body: unknown) {
  const origin = (body as { origin?: LatLng }).origin;
  const destination = (body as { destination?: LatLng }).destination;

  if (
    !origin ||
    !destination ||
    !isValidCoord(origin.lat, origin.lng) ||
    !isValidCoord(destination.lat, destination.lng)
  ) {
    return NextResponse.json({ error: "origin and destination required" }, { status: 400 });
  }

  let routes = await googleRoutes(origin, destination);
  if (!routes?.options?.length) {
    routes = await osrmRoutes(origin, destination);
  }

  if (!routes?.options?.length) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  return NextResponse.json(routes);
}
