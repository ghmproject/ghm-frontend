import { NextRequest, NextResponse } from "next/server";

import { buildGeocodeQueries } from "@/lib/maps/geocodeQueries";
import { BRISBANE_BOUNDS } from "@/lib/maps/googleMaps";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

function inBrisbane(lat: number, lng: number): boolean {
  return (
    lat >= BRISBANE_BOUNDS.south &&
    lat <= BRISBANE_BOUNDS.north &&
    lng >= BRISBANE_BOUNDS.west &&
    lng <= BRISBANE_BOUNDS.east
  );
}

async function geocodeOneQuery(
  searchQuery: string,
): Promise<{ lat: number; lng: number; label: string } | null> {
  const viewbox = `${BRISBANE_BOUNDS.west},${BRISBANE_BOUNDS.south},${BRISBANE_BOUNDS.east},${BRISBANE_BOUNDS.north}`;

  const looksComplete =
    /,/.test(searchQuery) && /\b(australia|qld|queensland)\b/i.test(searchQuery);
  const q = looksComplete ? searchQuery : `${searchQuery}, Queensland, Australia`;

  const url = new URL(NOMINATIM);
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "au");
  url.searchParams.set("viewbox", viewbox);
  url.searchParams.set("bounded", "0");

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "GuessHowMuch/1.0 (local dev; https://example.com/contact)",
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  if (!Array.isArray(data)) return null;

  for (const row of data) {
    const lat = Number.parseFloat(row.lat);
    const lng = Number.parseFloat(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (inBrisbane(lat, lng)) {
      return { lat, lng, label: row.display_name };
    }
  }

  return null;
}

/** Proxy geocode so we can send a proper User-Agent (browser fetch cannot). */
export async function handleGeocode(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json(null);
  }

  const queries = buildGeocodeQueries(q);
  const toTry = queries.length > 0 ? queries : [q];

  for (const query of toTry) {
    const hit = await geocodeOneQuery(query);
    if (hit) {
      return NextResponse.json(hit);
    }
  }

  return NextResponse.json(null);
}
