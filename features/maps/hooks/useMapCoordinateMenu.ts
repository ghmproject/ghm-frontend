"use client";

import { useCallback, useState } from "react";

import type { MapCoordinateMenuState } from "@/features/maps/components/MapCoordinateMenu";

export function useMapCoordinateMenu() {
  const [menu, setMenu] = useState<MapCoordinateMenuState | null>(null);

  const openAt = useCallback((clientX: number, clientY: number, lat: number, lng: number) => {
    setMenu({ x: clientX, y: clientY, lat, lng });
  }, []);

  const openFromEvent = useCallback(
    (e: { clientX: number; clientY: number; preventDefault: () => void; stopPropagation?: () => void }, lat: number, lng: number) => {
      e.preventDefault();
      e.stopPropagation?.();
      openAt(e.clientX, e.clientY, lat, lng);
    },
    [openAt],
  );

  const close = useCallback(() => setMenu(null), []);

  return { menu, openAt, openFromEvent, close };
}
