"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

import { MapPageSkeleton } from "@/features/maps/components/MapPageSkeleton";

const MapExploreScreen = dynamic(
  () =>
    import("@/features/maps/components/MapExploreScreen").then((m) => ({
      default: m.MapExploreScreen,
    })),
  {
    ssr: false,
    loading: () => <MapPageSkeleton />,
  },
);

export function MapExploreScreenLazy() {
  useEffect(() => {
    void import("@/features/maps/components/DealMap");
    void import("@/features/maps/components/MapExploreScreen");
  }, []);

  return <MapExploreScreen />;
}
