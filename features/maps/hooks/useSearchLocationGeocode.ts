"use client";

import { useEffect, useRef } from "react";

import type { SearchLocationHit } from "@/features/restaurants/store/mapExplore.store";
import { MAPS_API_PATH } from "@/lib/maps/mapsApi";

export function useSearchLocationGeocode(
  query: string,
  setLocation: (loc: SearchLocationHit | null) => void,
) {
  const setRef = useRef(setLocation);
  setRef.current = setLocation;

  useEffect(() => {
    const t = query.trim();
    if (t.length < 3) {
      setRef.current(null);
      return;
    }

    const ac = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `${MAPS_API_PATH}?action=geocode&q=${encodeURIComponent(t)}`,
          {
            signal: ac.signal,
          },
        );
        if (!res.ok) {
          setRef.current(null);
          return;
        }
        const json = (await res.json()) as SearchLocationHit | null;
        if (json && typeof json.lat === "number" && typeof json.lng === "number") {
          setRef.current(json);
        } else {
          setRef.current(null);
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setRef.current(null);
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [query]);
}
