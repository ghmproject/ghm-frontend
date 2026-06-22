import { NextRequest, NextResponse } from "next/server";

import type { MapsApiAction } from "@/lib/maps/mapsApi";
import { handleDrivingDistances } from "@/lib/maps/server/handleDrivingDistances";
import { handleDrivingRoute } from "@/lib/maps/server/handleDrivingRoute";
import { handleGeocode } from "@/lib/maps/server/handleGeocode";
import { handleReverseGeocode } from "@/lib/maps/server/handleReverseGeocode";

function parseAction(value: string | null): MapsApiAction | null {
  if (
    value === "geocode" ||
    value === "reverse-geocode" ||
    value === "driving-route" ||
    value === "driving-distances"
  ) {
    return value;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const action = parseAction(req.nextUrl.searchParams.get("action"));
  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  switch (action) {
    case "geocode":
      return handleGeocode(req);
    case "reverse-geocode":
      return handleReverseGeocode(req);
    default:
      return NextResponse.json({ error: "Use POST for this action" }, { status: 405 });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = parseAction((body as { action?: string }).action ?? null);
  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  switch (action) {
    case "driving-route":
      return handleDrivingRoute(body);
    case "driving-distances":
      return handleDrivingDistances(body);
    default:
      return NextResponse.json({ error: "Use GET for this action" }, { status: 405 });
  }
}
