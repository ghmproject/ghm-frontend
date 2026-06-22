import { NextResponse } from "next/server";

import { env } from "@/config/env";

type LatLng = { lat: number; lng: number };
type Destination = LatLng & { id: string };

const MAX_DESTINATIONS = 100;
const GOOGLE_BATCH = 25;
const OSRM_BASE = "https://router.project-osrm.org";

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

async function googleDrivingKm(
  origin: LatLng,
  destinations: Destination[],
): Promise<Record<string, number>> {
  const key = env.googleMapsApiKey.trim();
  if (!key) return {};

  const out: Record<string, number> = {};

  for (let i = 0; i < destinations.length; i += GOOGLE_BATCH) {
    const batch = destinations.slice(i, i + GOOGLE_BATCH);
    const destParam = batch.map((d) => `${d.lat},${d.lng}`).join("|");
    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", `${origin.lat},${origin.lng}`);
    url.searchParams.set("destinations", destParam);
    url.searchParams.set("mode", "driving");
    url.searchParams.set("key", key);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) continue;

    const json = (await res.json()) as {
      rows?: { elements?: { status?: string; distance?: { value?: number } }[] }[];
    };

    const elements = json.rows?.[0]?.elements ?? [];
    batch.forEach((dest, idx) => {
      const el = elements[idx];
      if (el?.status === "OK" && el.distance?.value != null) {
        out[dest.id] = el.distance.value / 1000;
      }
    });
  }

  return out;
}

async function osrmDrivingKm(
  origin: LatLng,
  destinations: Destination[],
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const CHUNK = 50;

  for (let i = 0; i < destinations.length; i += CHUNK) {
    const batch = destinations.slice(i, i + CHUNK);
    const points = [origin, ...batch];
    const coordStr = points.map((p) => `${p.lng},${p.lat}`).join(";");
    const destIdx = batch.map((_, j) => j + 1).join(";");

    const url = `${OSRM_BASE}/table/v1/driving/${coordStr}?sources=0&destinations=${destIdx}&annotations=distance`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) continue;

    const json = (await res.json()) as {
      code?: string;
      distances?: number[][];
    };

    if (json.code !== "Ok" || !json.distances?.[0]) continue;

    batch.forEach((dest, j) => {
      const meters = json.distances![0][j];
      if (meters != null && Number.isFinite(meters) && meters >= 0) {
        out[dest.id] = meters / 1000;
      }
    });
  }

  return out;
}

export async function handleDrivingDistances(body: unknown) {
  const origin = (body as { origin?: LatLng }).origin;
  const destinations = (body as { destinations?: Destination[] }).destinations;

  if (
    !origin ||
    !isValidCoord(origin.lat, origin.lng) ||
    !Array.isArray(destinations) ||
    destinations.length === 0
  ) {
    return NextResponse.json({ error: "origin and destinations required" }, { status: 400 });
  }

  if (destinations.length > MAX_DESTINATIONS) {
    return NextResponse.json(
      { error: `At most ${MAX_DESTINATIONS} destinations` },
      { status: 400 },
    );
  }

  const validDests = destinations.filter(
    (d) => d?.id && isValidCoord(d.lat, d.lng),
  ) as Destination[];

  let distances = await googleDrivingKm(origin, validDests);

  const missing = validDests.filter((d) => distances[d.id] == null);
  if (missing.length > 0) {
    const osrm = await osrmDrivingKm(origin, missing);
    distances = { ...distances, ...osrm };
  }

  return NextResponse.json({ distances });
}
