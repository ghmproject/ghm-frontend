"use client";

import dynamic from "next/dynamic";

import { env } from "@/config/env";
import { MapLoadingSkeleton } from "@/features/maps/components/MapLoadingSkeleton";
import type { DealMapProps } from "@/features/maps/map-types";

const mapLoading = () => <MapLoadingSkeleton />;

const DealMapGoogle = dynamic(
  () =>
    import("@/features/maps/components/DealMapGoogle").then((m) => ({
      default: m.DealMapGoogle,
    })),
  { ssr: false, loading: mapLoading },
);

const DealMapLeaflet = dynamic(
  () =>
    import("@/features/maps/components/DealMapLeaflet").then((m) => ({
      default: m.DealMapLeaflet,
    })),
  { ssr: false, loading: mapLoading },
);

export type { DealMapProps } from "@/features/maps/map-types";

export function DealMap(props: DealMapProps) {
  const useGoogle = env.googleMapsApiKey.trim().length > 0;
  const MapImpl = useGoogle ? DealMapGoogle : DealMapLeaflet;
  return (
    <div className="h-full min-h-0 w-full" role="region" aria-label="Restaurant map">
      <MapImpl {...props} />
    </div>
  );
}
