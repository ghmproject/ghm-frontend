"use client";

import { MapPin, Navigation, Plus, Search, SlidersHorizontal, User } from "lucide-react";
import { useMemo, useEffect, useLayoutEffect, useRef, useState } from "react";

import { routes } from "@/config/routes";
import { PRICE_FILTER_CHIPS } from "@/constants/filters";
import { DealMap } from "@/features/maps/components/DealMap";
import { DropFeedModal } from "@/features/maps/components/DropFeedModal";
import { MapFilterFeedsModal } from "@/features/maps/components/MapFilterFeedsModal";
import {
  MapRestaurantSidePanel,
  type SidePanelAnchor,
} from "@/features/maps/components/MapRestaurantSidePanel";
import { useDrivingDistances } from "@/features/maps/hooks/useDrivingDistances";
import { useNearbyRestaurants } from "@/features/maps/hooks/useNearbyRestaurants";
import { useSearchLocationGeocode } from "@/features/maps/hooks/useSearchLocationGeocode";
import { useUserLocation } from "@/features/maps/hooks/useUserLocation";
import { LOCATION_PROMPT_AUTO_DISMISS_MS } from "@/constants/limits";
import { RestaurantPreviewCard } from "@/features/restaurants/components/RestaurantPreviewCard";
import {
  listingsHubLabel,
  nearbySearchConfig,
  resolveNearbySearchCenter,
} from "@/config/nearbySearch";
import {
  filterRestaurants,
  useMapExploreStore,
  withDistances,
} from "@/features/restaurants/store/mapExplore.store";
import { isNearBrisbane } from "@/features/maps/utils/nearBrisbane";
import { cn } from "@/lib/utils/cn";

const ACCENT = "#FF5722";

/** Same corner radius as Filter / Account (map header chrome). */
const MAP_HEADER_CONTROL_ROUNDED = "rounded-2xl";

export function MapExploreScreen() {
  const { coords, state, refresh } = useUserLocation();
  const locationReady = state.status === "ready";
  const nearbySearchCenter = useMemo(
    () => resolveNearbySearchCenter(coords, locationReady),
    [coords, locationReady],
  );
  const activePriceFilter = useMapExploreStore((s) => s.activePriceFilter);
  const activeCuisine = useMapExploreStore((s) => s.activeCuisine);
  const showOnlyFeeds = useMapExploreStore((s) => s.showOnlyFeeds);
  const {
    restaurants: nearbyRestaurants,
    isLoading: nearbyLoading,
    isError: nearbyError,
    refetch: refetchNearby,
  } = useNearbyRestaurants(nearbySearchCenter, {
    priceFilterId: activePriceFilter,
    cuisineId: activeCuisine,
  });

  useEffect(() => {
    if (!locationReady) return;
    void refetchNearby();
  }, [locationReady, refetchNearby]);
  const searchQuery = useMapExploreStore((s) => s.searchQuery);
  const selectedRestaurantId = useMapExploreStore((s) => s.selectedRestaurantId);
  const searchLocation = useMapExploreStore((s) => s.searchLocation);
  const setSearchLocation = useMapExploreStore((s) => s.setSearchLocation);
  const setActivePriceFilter = useMapExploreStore((s) => s.setActivePriceFilter);
  const setActiveCuisine = useMapExploreStore((s) => s.setActiveCuisine);
  const setShowOnlyFeeds = useMapExploreStore((s) => s.setShowOnlyFeeds);
  const setSearchQuery = useMapExploreStore((s) => s.setSearchQuery);
  const setSelectedRestaurantId = useMapExploreStore((s) => s.setSelectedRestaurantId);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [dropFeedOpen, setDropFeedOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const searchFieldRef = useRef<HTMLDivElement>(null);
  const mapHeaderChromeRef = useRef<HTMLElement>(null);
  const [filterPanelTopPx, setFilterPanelTopPx] = useState<number | null>(null);
  const [filterMobileSheetTopPx, setFilterMobileSheetTopPx] = useState<number | null>(null);
  const [sidePanelAnchor, setSidePanelAnchor] = useState<SidePanelAnchor | null>(null);
  const [locationPromptVisible, setLocationPromptVisible] = useState(true);

  useSearchLocationGeocode(searchQuery, setSearchLocation);

  useEffect(() => {
    if (locationReady) {
      setLocationPromptVisible(true);
      return;
    }
    setLocationPromptVisible(true);
    const timer = window.setTimeout(
      () => setLocationPromptVisible(false),
      LOCATION_PROMPT_AUTO_DISMISS_MS,
    );
    return () => window.clearTimeout(timer);
  }, [locationReady, state.status]);

  useEffect(() => {
    setSelectedRestaurantId(null);
  }, [activePriceFilter, activeCuisine, showOnlyFeeds, searchQuery, setSelectedRestaurantId]);

  useEffect(() => {
    setSidePanelOpen(false);
  }, [selectedRestaurantId]);

  useLayoutEffect(() => {
    if (!filterModalOpen) {
      setFilterPanelTopPx(null);
      setFilterMobileSheetTopPx(null);
      return;
    }
    const measure = () => {
      const el = searchFieldRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const NUDGE_PX = 6;
        setFilterPanelTopPx(Math.round(r.top + r.height / 2 + NUDGE_PX));
      }
      const chrome = mapHeaderChromeRef.current;
      if (chrome) {
        setFilterMobileSheetTopPx(Math.round(chrome.getBoundingClientRect().bottom));
      }
    };
    measure();
    window.addEventListener("resize", measure);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", measure);
    vv?.addEventListener("scroll", measure);
    const searchEl = searchFieldRef.current;
    const chromeEl = mapHeaderChromeRef.current;
    const ro = new ResizeObserver(measure);
    if (searchEl) ro.observe(searchEl);
    if (chromeEl) ro.observe(chromeEl);
    return () => {
      window.removeEventListener("resize", measure);
      vv?.removeEventListener("resize", measure);
      vv?.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [filterModalOpen]);

  useLayoutEffect(() => {
    if (!sidePanelOpen) {
      setSidePanelAnchor(null);
      return;
    }
    const NUDGE_PX = 6;
    const measure = () => {
      const el = searchFieldRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setSidePanelAnchor({
        topPx: Math.round(r.top + r.height / 2 + NUDGE_PX),
      });
    };
    measure();
    window.addEventListener("resize", measure);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", measure);
    vv?.addEventListener("scroll", measure);
    const el = searchFieldRef.current;
    const ro = el ? new ResizeObserver(measure) : null;
    if (el && ro) ro.observe(el);
    return () => {
      window.removeEventListener("resize", measure);
      vv?.removeEventListener("resize", measure);
      vv?.removeEventListener("scroll", measure);
      ro?.disconnect();
    };
  }, [sidePanelOpen]);

  useEffect(() => {
    if (!sidePanelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidePanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidePanelOpen]);

  const filtered = useMemo(
    () =>
      filterRestaurants(
        nearbyRestaurants,
        activePriceFilter,
        searchQuery,
        searchLocation,
        activeCuisine,
        showOnlyFeeds,
      ),
    [
      nearbyRestaurants,
      activePriceFilter,
      activeCuisine,
      showOnlyFeeds,
      searchQuery,
      searchLocation,
    ],
  );

  const flyTo = useMemo(() => {
    if (searchLocation) {
      return { lat: searchLocation.lat, lng: searchLocation.lng };
    }
    return nearbySearchCenter;
  }, [searchLocation, nearbySearchCenter]);

  const distanceOrigin = useMemo(() => {
    if (searchLocation) {
      const pin = { lat: searchLocation.lat, lng: searchLocation.lng };
      if (isNearBrisbane(pin)) return pin;
    }
    if (coords) return coords;
    return null;
  }, [coords, searchLocation]);

  const withStraightLine = useMemo(
    () => withDistances(filtered, distanceOrigin),
    [filtered, distanceOrigin],
  );

  const { drivingKmById } = useDrivingDistances(distanceOrigin, filtered);

  const withDist = useMemo(
    () =>
      withStraightLine.map((r) => {
        const driveKm = drivingKmById[r.id];
        if (driveKm != null && Number.isFinite(driveKm)) {
          return { ...r, distanceKm: driveKm, distanceIsDriving: true };
        }
        return { ...r, distanceIsDriving: false };
      }),
    [withStraightLine, drivingKmById],
  );

  const selected = useMemo(
    () => withDist.find((r) => r.id === selectedRestaurantId) ?? null,
    [withDist, selectedRestaurantId],
  );

  return (
    <div className="flex h-[100dvh] w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-white">
      <header
        ref={mapHeaderChromeRef}
        className="relative z-[100] isolate w-full shrink-0 border-b border-neutral-200/90 bg-white max-sm:pt-[max(0px,env(safe-area-inset-top))] sm:pt-[max(0.25rem,env(safe-area-inset-top))]"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] gap-x-2 gap-y-2 py-2.5 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-rows-1 sm:items-center sm:gap-2.5 sm:px-3 sm:py-2.5">
          <div
            ref={searchFieldRef}
            className="relative col-start-1 row-start-1 min-w-0 w-full max-sm:max-w-[11.5rem] max-sm:justify-self-start sm:max-w-none sm:w-52 sm:shrink-0 md:w-60"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 z-[2] h-[17px] w-[17px] -translate-y-1/2 text-neutral-400 max-sm:left-3 max-sm:h-[17px] max-sm:w-[17px]" />
            <input
              type="text"
              role="searchbox"
              name="map-search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="search"
              enterKeyHint="search"
              placeholder="Search"
              aria-label="Search map"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "relative z-[1] box-border h-9 w-full border-0 bg-neutral-100 py-0 pl-9 pr-3 text-sm leading-9 text-neutral-800 outline-none ring-0 transition placeholder:text-neutral-500 focus:bg-white focus:ring-2 focus:ring-[#FF5722]/25 max-sm:h-[2.375rem] max-sm:pl-9 max-sm:pr-2.5 max-sm:text-[13px] max-sm:leading-[2.375rem] sm:h-10 sm:leading-10",
                MAP_HEADER_CONTROL_ROUNDED,
              )}
            />
          </div>

          <div className="col-start-2 row-start-1 flex min-w-0 shrink-0 items-center gap-1 self-center max-sm:gap-1 sm:col-start-3 sm:row-start-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setFilterModalOpen(true)}
              className={cn(
                "flex h-9 shrink-0 items-center gap-1.5 bg-neutral-100 px-2.5 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-200/90 max-sm:h-[2.375rem] max-sm:gap-1 max-sm:px-2.5 max-sm:text-[11px] sm:h-10 sm:px-3",
                MAP_HEADER_CONTROL_ROUNDED,
              )}
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-neutral-600" />
              <span className="whitespace-nowrap">Filter</span>
            </button>
            <button
              type="button"
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200/90 max-sm:h-[2.375rem] max-sm:w-[2.375rem] sm:h-10 sm:w-10",
                MAP_HEADER_CONTROL_ROUNDED,
              )}
              aria-label="Account"
            >
              <User className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <div className="col-span-2 row-start-2 flex min-h-0 w-full min-w-0 items-center gap-1.5 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:py-0.5 [&::-webkit-scrollbar]:hidden">
            {PRICE_FILTER_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActivePriceFilter(chip.id)}
                className={cn(
                  "shrink-0 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-700 max-sm:px-3 max-sm:py-2 max-sm:text-xs sm:px-3 sm:py-2 sm:text-xs",
                  MAP_HEADER_CONTROL_ROUNDED,
                  activePriceFilter === chip.id
                    ? "bg-neutral-300 text-neutral-900 shadow-inner"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/90",
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <MapFilterFeedsModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        panelTopPx={filterPanelTopPx}
        mobileSheetTopPx={filterMobileSheetTopPx}
        searchCenter={nearbySearchCenter}
        searchQuery={searchQuery}
        searchLocation={searchLocation}
        activePriceFilter={activePriceFilter}
        activeCuisine={activeCuisine}
        showOnlyFeeds={showOnlyFeeds}
        onApply={({ price, cuisine, show }) => {
          setActivePriceFilter(price);
          setActiveCuisine(cuisine);
          setShowOnlyFeeds(show);
        }}
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 z-0 min-h-0">
          <DealMap
            restaurants={withDist}
            userCoords={coords}
            selectedId={selectedRestaurantId}
            onSelect={setSelectedRestaurantId}
            flyTo={flyTo}
            routeFrom={distanceOrigin}
          />
        </div>

        {!locationReady && locationPromptVisible && (
          <div className="pointer-events-auto absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 p-6 backdrop-blur-[2px]">
            <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF5722]/10">
                <MapPin className="h-7 w-7 text-[#FF5722]" />
              </div>
              <p className="text-lg font-semibold text-neutral-900">Turn on your location</p>
              <p className="mt-2 text-sm leading-snug text-neutral-600">
                {state.status === "loading" || state.status === "idle"
                  ? `Deals are around ${listingsHubLabel()}. Allow location to centre the map on you, or browse listings (${nearbySearchConfig.radiusKm} km radius).`
                  : state.status === "denied" || state.status === "unavailable"
                    ? state.message
                    : ""}
              </p>
              {(state.status === "denied" ||
                state.status === "unavailable" ||
                state.status === "idle") && (
                <button
                  type="button"
                  onClick={refresh}
                  className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-105"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Navigation className="h-4 w-4" />
                  Enable location
                </button>
              )}
            </div>
          </div>
        )}

        {nearbySearchCenter && nearbyLoading && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-neutral-700 shadow-md">
            Loading nearby dealsâ€¦
          </div>
        )}

        {nearbySearchCenter && nearbyError && !nearbyLoading && (
          <div className="pointer-events-auto absolute left-2 right-2 top-2 z-20 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 shadow-md sm:left-3 sm:right-auto sm:max-w-sm">
            <p className="font-semibold">Could not load nearby restaurants</p>
            <p className="mt-1 text-red-800/90">Check that the backend is running, then try again.</p>
            <button
              type="button"
              onClick={() => void refetchNearby()}
              className="mt-2 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-950"
            >
              Retry
            </button>
          </div>
        )}


        {selected && !sidePanelOpen && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[calc(4.85rem+env(safe-area-inset-bottom))] z-40 flex justify-center pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:pl-[max(1rem,env(safe-area-inset-left))] sm:pr-[max(1rem,env(safe-area-inset-right))]">
            <div
              key={selected.id}
              className="pointer-events-auto w-full max-w-[27.25rem] shrink-0 motion-safe:animate-[ghm-map-peek-in_0.34s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none"
            >
              <RestaurantPreviewCard
                restaurant={selected}
                href={routes.restaurant(selected.id)}
                onOpen={() => setSidePanelOpen(true)}
                compact
              />
            </div>
          </div>
        )}

        {!sidePanelOpen && !selected && (
          <div
            className={cn(
              "pointer-events-none absolute left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))] z-[41] flex justify-end",
              "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]",
            )}
          >
            <button
              type="button"
              onClick={() => setDropFeedOpen(true)}
              className="pointer-events-auto flex max-w-full min-w-0 cursor-pointer items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(230,74,25,0.45)] transition hover:brightness-105 active:scale-[0.98] sm:max-w-[20rem] sm:px-5"
              style={{ backgroundColor: ACCENT }}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Plus className="h-4 w-4 text-white" strokeWidth={2.5} />
              </span>
              <span className="min-w-0 truncate pr-0.5">Found a ripper?</span>
            </button>
          </div>
        )}
      </div>

      {selected && sidePanelOpen && (
        <MapRestaurantSidePanel
          restaurant={selected}
          anchor={sidePanelAnchor}
          onClose={() => setSidePanelOpen(false)}
        />
      )}

      <DropFeedModal open={dropFeedOpen} onClose={() => setDropFeedOpen(false)} />
    </div>
  );
}
