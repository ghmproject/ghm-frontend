import { nearbySearchConfig } from "@/config/nearbySearch";
import type { LatLng } from "@/features/restaurants/types/restaurant";
import { buildGeocodeQueries } from "@/lib/maps/geocodeQueries";
import { getMapsApiUrl } from "@/lib/maps/mapsApi";

export const DROP_FEED_SUBURB_ONLY_ERROR =
  "Enter the full street address (e.g. 735 Beams Rd, Carseldine QLD 4034). Suburb names only (West End, Sunnybank, East End, etc.) are not accepted.";

/** True when input looks like a real street address (not suburb name only). */
export function isFullStreetAddress(input: string): boolean {
  const t = input.trim();
  if (!t || t.length < 6) return false;

  const hasStreetNumber =
    /\b\d{1,5}[A-Za-z]?\s+[A-Za-z]/.test(t) ||
    /\b(?:shop|unit|suite|level|lot)\s*#?\s*\d+/i.test(t) ||
    /\b\d+\s*\/\s*\d+/.test(t);

  const hasStreetType =
    /\b(street|st|road|rd|avenue|ave|drive|dr|court|ct|parade|pde|lane|ln|way|blvd|boulevard|crescent|cres|highway|hwy|terrace|tce)\b/i.test(
      t,
    );

  if (hasStreetNumber && (hasStreetType || /,/.test(t))) return true;
  if (/^\d+\s+\S/.test(t) && hasStreetType) return true;
  if (/,/.test(t) && /\b\d{4}\b/.test(t) && hasStreetNumber) return true;

  if (
    /\b(street|st|road|rd|avenue|ave|drive|dr|court|ct|parade|pde|lane|ln|way|blvd|boulevard|crescent|cres|highway|hwy|central|shop)\b/i.test(
      t,
    ) &&
    /\d/.test(t)
  ) {
    return true;
  }

  return false;
}

export function isSuburbNameOnlyInput(input: string): boolean {
  const raw = input.trim();
  if (!raw) return true;
  return !isFullStreetAddress(raw);
}

async function geocodeOneQuery(query: string): Promise<LatLng | null> {
  const res = await fetch(
    `${getMapsApiUrl()}?action=geocode&q=${encodeURIComponent(query.trim())}`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { lat?: number; lng?: number } | null;
  if (data && typeof data.lat === "number" && typeof data.lng === "number") {
    return { lat: data.lat, lng: data.lng };
  }
  return null;
}

/** Client-side geocode (map search). Drop-a-feed uses server geocoding. */
export async function geocodeAddress(query: string): Promise<LatLng | null> {
  for (const q of buildGeocodeQueries(query)) {
    const coords = await geocodeOneQuery(q);
    if (coords) return coords;
  }
  return null;
}

/** Device GPS sent with submission (server uses geocoded address when valid). */
export function getDropFeedClientCoords(): Promise<LatLng> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(nearbySearchConfig.listingsHub);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(nearbySearchConfig.listingsHub),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 12_000 },
    );
  });
}
