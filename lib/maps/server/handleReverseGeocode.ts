import { NextRequest, NextResponse } from "next/server";

import { extractSuburbLabel } from "@/lib/maps/extractSuburbLabel";
import { BRISBANE_BOUNDS } from "@/lib/maps/googleMaps";

const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";

function inBrisbane(lat: number, lng: number): boolean {
  return (
    lat >= BRISBANE_BOUNDS.south &&
    lat <= BRISBANE_BOUNDS.north &&
    lng >= BRISBANE_BOUNDS.west &&
    lng <= BRISBANE_BOUNDS.east
  );
}

type NominatimAddress = {
  house_number?: string;
  road?: string;
  suburb?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

function formatAddressFromParts(addr: NominatimAddress, displayName: string): string {
  const suburb =
    addr.suburb ||
    addr.city_district ||
    addr.city ||
    addr.town ||
    addr.village ||
    "";
  const street = [addr.house_number, addr.road].filter(Boolean).join(" ");
  const state = addr.state ?? "QLD";
  const postcode = addr.postcode ?? "";

  if (street && suburb) {
    const line = `${street}, ${suburb} ${state}${postcode ? ` ${postcode}` : ""}`;
    return line.replace(/\s+/g, " ").trim();
  }

  return displayName.replace(/, Australia\s*$/i, "").trim();
}

/** Server-side reverse geocode for Drop a feed map pin. */
export async function handleReverseGeocode(req: NextRequest) {
  const latRaw = req.nextUrl.searchParams.get("lat");
  const lngRaw = req.nextUrl.searchParams.get("lng");
  const lat = Number(latRaw);
  const lng = Number(lngRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { success: false, message: "lat and lng are required" },
      { status: 400 },
    );
  }

  if (!inBrisbane(lat, lng)) {
    return NextResponse.json(
      {
        success: false,
        message: "Pin must be within the Greater Brisbane area.",
      },
      { status: 400 },
    );
  }

  const url = new URL(NOMINATIM_REVERSE);
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "18");

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "GuessHowMuch/1.0 (drop-feed-reverse-geocode)",
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Could not reach geocoding service." },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { success: false, message: "Reverse geocode failed." },
      { status: 502 },
    );
  }

  const data = (await res.json()) as {
    display_name?: string;
    address?: NominatimAddress;
  };

  const displayName = String(data.display_name ?? "").trim();
  if (!displayName) {
    return NextResponse.json(
      { success: false, message: "No address found for this location." },
      { status: 404 },
    );
  }

  const addr = data.address ?? {};
  const address = formatAddressFromParts(addr, displayName);
  const suburb =
    extractSuburbLabel(address) ||
    extractSuburbLabel(
      addr.suburb || addr.city || addr.town || addr.village || displayName,
    );

  return NextResponse.json({
    success: true,
    lat,
    lng,
    address,
    suburb,
    label: displayName,
  });
}
