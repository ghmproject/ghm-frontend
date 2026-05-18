"use client";

import { useEffect, useState } from "react";

import { useDrivingRoute } from "@/features/maps/hooks/useDrivingRoute";
import type { LatLng } from "@/features/restaurants/types/restaurant";

export function useRouteSelection(
  from: LatLng | null | undefined,
  to: LatLng | null | undefined,
) {
  const { data, isLoading, isFetching } = useDrivingRoute(from, to);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [from?.lat, from?.lng, to?.lat, to?.lng]);

  const options = data?.options ?? [];

  useEffect(() => {
    if (selectedIndex >= options.length) {
      setSelectedIndex(0);
    }
  }, [options.length, selectedIndex]);

  return {
    options,
    selectedIndex,
    setSelectedIndex,
    isLoading: isLoading || isFetching,
  };
}
