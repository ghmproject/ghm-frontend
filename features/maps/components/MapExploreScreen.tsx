"use client";

import dynamic from "next/dynamic";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useMemo, useEffect, useLayoutEffect, useRef, useState } from "react";

import { ProfileLink } from "@/components/layout/ProfileLink";
import { routes } from "@/config/routes";
import { PRICE_FILTER_CHIPS } from "@/constants/filters";
import { MapLoadingSkeleton } from "@/features/maps/components/MapLoadingSkeleton";
import { MapSearchResultsPanel } from "@/features/maps/components/MapSearchResultsPanel";
import type { SidePanelAnchor } from "@/features/maps/components/MapRestaurantSidePanel";
import { useDrivingDistances } from "@/features/maps/hooks/useDrivingDistances";
import { useNearbyRestaurants } from "@/features/maps/hooks/useNearbyRestaurants";
import { useSearchLocationGeocode } from "@/features/maps/hooks/useSearchLocationGeocode";
import { useUserLocation } from "@/features/maps/hooks/useUserLocation";
import { RestaurantPreviewCard } from "@/features/restaurants/components/RestaurantPreviewCard";
import {
  resolveNearbySearchCenter,
} from "@/config/nearbySearch";
import {
  filterRestaurants,
  useMapExploreStore,
  withDistances,
} from "@/features/restaurants/store/mapExplore.store";
import { isNearBrisbane } from "@/features/maps/utils/nearBrisbane";
import { useDeferredReady } from "@/lib/perf/useDeferredReady";
import { cn } from "@/lib/utils/cn";

const DealMap = dynamic(
  () => import("@/features/maps/components/DealMap").then((m) => ({ default: m.DealMap })),
  { ssr: false, loading: () => <MapLoadingSkeleton /> },
);

const MapFilterFeedsModal = dynamic(
  () =>
    import("@/features/maps/components/MapFilterFeedsModal").then((m) => ({
      default: m.MapFilterFeedsModal,
    })),
  { ssr: false },
);

const MapSearchResultsMobile = dynamic(
  () =>
    import("@/features/maps/components/MapSearchResultsMobile").then((m) => ({
      default: m.MapSearchResultsMobile,
    })),
  { ssr: false },
);

const MapRestaurantSidePanel = dynamic(
  () =>
    import("@/features/maps/components/MapRestaurantSidePanel").then((m) => ({
      default: m.MapRestaurantSidePanel,
    })),
  { ssr: false },
);

const ProfileSidePanel = dynamic(
  () =>
    import("@/features/profile/components/ProfileSidePanel").then((m) => ({
      default: m.ProfileSidePanel,
    })),
  { ssr: false },
);

const DropFeedModal = dynamic(
  () =>
    import("@/features/maps/components/DropFeedModal").then((m) => ({
      default: m.DropFeedModal,
    })),
  { ssr: false },
);

const ACCENT = "#FF5722";

/** Same corner radius as Filter / Account (map header chrome). */
const MAP_HEADER_CONTROL_ROUNDED = "rounded-2xl";

export function MapExploreScreen() {
  const { coords } = useUserLocation();
  const nearbySearchCenter = useMemo(
    () => resolveNearbySearchCenter(coords, coords != null),
    [coords],
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
    showOnlyFeeds,
  });

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
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [dropFeedOpen, setDropFeedOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterPanelTopPx, setFilterPanelTopPx] = useState<number | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchFieldRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sidePanelAnchor, setSidePanelAnchor] = useState<SidePanelAnchor | null>(null);
  const [profilePanelAnchor, setProfilePanelAnchor] = useState<SidePanelAnchor | null>(null);

  useSearchLocationGeocode(searchQuery, setSearchLocation);

  useEffect(() => {
    setSelectedRestaurantId(null);
  }, [activePriceFilter, activeCuisine, showOnlyFeeds, searchQuery, setSelectedRestaurantId]);

  useEffect(() => {
    setSidePanelOpen(false);
  }, [selectedRestaurantId]);

  const dismissSearch = useCallback(() => {
    setSearchFocused(false);
    searchInputRef.current?.blur();
  }, []);

  const handleMapClick = useCallback(() => {
    dismissSearch();
    setSelectedRestaurantId(null);
  }, [dismissSearch, setSelectedRestaurantId]);

  useEffect(() => {
    if (!searchFocused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchFocused, dismissSearch]);

  useEffect(() => {
    if (!searchFocused || typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 640px)");
    if (mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [searchFocused]);

  const measureHeaderAnchor = () => {
    const el = searchFieldRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const NUDGE_PX = 6;
    return { topPx: Math.round(r.top + r.height / 2 + NUDGE_PX) };
  };

  const openProfilePanel = () => {
    setSidePanelOpen(false);
    setProfilePanelAnchor(measureHeaderAnchor());
    setProfilePanelOpen(true);
  };

  useLayoutEffect(() => {
    if (!filterModalOpen) {
      setFilterPanelTopPx(null);
      return;
    }
    const measure = () => {
      const anchor = measureHeaderAnchor();
      if (anchor) setFilterPanelTopPx(anchor.topPx);
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
  }, [filterModalOpen]);

  useLayoutEffect(() => {
    if (!sidePanelOpen) {
      setSidePanelAnchor(null);
      return;
    }
    const measure = () => {
      const anchor = measureHeaderAnchor();
      if (anchor) setSidePanelAnchor(anchor);
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

  useLayoutEffect(() => {
    if (!profilePanelOpen) {
      setProfilePanelAnchor(null);
      return;
    }
    const measure = () => {
      const anchor = measureHeaderAnchor();
      if (anchor) setProfilePanelAnchor(anchor);
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
  }, [profilePanelOpen]);

  useEffect(() => {
    if (!sidePanelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidePanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidePanelOpen]);

  useEffect(() => {
    if (!profilePanelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfilePanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [profilePanelOpen]);

  const filtered = useMemo(
    () =>
      filterRestaurants(
        nearbyRestaurants,
        activePriceFilter,
        searchQuery,
        searchLocation,
        activeCuisine,
        showOnlyFeeds,
        showOnlyFeeds !== "all",
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
    // Straight-line + driving origin when GPS not granted yet (same hub as nearby listings).
    return nearbySearchCenter;
  }, [coords, searchLocation, nearbySearchCenter]);

  const withStraightLine = useMemo(
    () => withDistances(filtered, distanceOrigin),
    [filtered, distanceOrigin],
  );

  /** Paint shell first so LCP is the skeleton, not late map tiles. */
  const mapMountReady = useDeferredReady({ timeoutMs: 120, fallbackDelayMs: 0 });
  const { drivingKmById } = useDrivingDistances(distanceOrigin, filtered, {
    enabled: distanceOrigin != null && filtered.length > 0,
  });

  const withDist = useMemo(
    () =>
      withStraightLine.map((r) => {
        const driveKm = drivingKmById[r.id];
        if (driveKm != null && Number.isFinite(driveKm)) {
          return { ...r, distanceKm: driveKm, distanceIsDriving: true };
        }
        return { ...r, distanceKm: r.distanceKm, distanceIsDriving: false };
      }),
    [withStraightLine, drivingKmById],
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return [...withDist].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }, [withDist, searchQuery]);

  const mapRestaurants = withDist;

  const lastVenueIdRef = useRef<string | null>(null);

  /** When the selected meal is hidden/deleted, select another pin at the same restaurant. */
  useEffect(() => {
    if (!selectedRestaurantId) {
      lastVenueIdRef.current = null;
      return;
    }

    const current = withDist.find((r) => r.id === selectedRestaurantId);
    if (current) {
      lastVenueIdRef.current = current.restaurantId ?? null;
      return;
    }

    const venueId =
      lastVenueIdRef.current ??
      nearbyRestaurants.find((r) => r.id === selectedRestaurantId)?.restaurantId ??
      null;

    if (!venueId) {
      setSelectedRestaurantId(null);
      lastVenueIdRef.current = null;
      return;
    }

    const replacement = withDist.find((r) => r.restaurantId === venueId);
    if (replacement && replacement.id !== selectedRestaurantId) {
      setSelectedRestaurantId(replacement.id);
      lastVenueIdRef.current = venueId;
    } else if (!replacement) {
      setSelectedRestaurantId(null);
      lastVenueIdRef.current = null;
    }
  }, [
    selectedRestaurantId,
    withDist,
    nearbyRestaurants,
    setSelectedRestaurantId,
  ]);

  const showSearchResults = searchFocused && searchQuery.trim().length > 0;

  const selected = useMemo(
    () => mapRestaurants.find((r) => r.id === selectedRestaurantId) ?? null,
    [mapRestaurants, selectedRestaurantId],
  );

  const closeSearch = dismissSearch;

  const handleSearchSelect = (id: string) => {
    setSelectedRestaurantId(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches) {
      dismissSearch();
    }
  };

  return (
    <div className="flex h-[100dvh] w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-white">
      <header
        className={cn(
          "relative z-[100] isolate w-full shrink-0 border-b border-neutral-200/90 bg-white max-sm:pt-[max(0px,env(safe-area-inset-top))] sm:pt-[max(0.25rem,env(safe-area-inset-top))]",
          showSearchResults && "overflow-visible sm:border-b-transparent",
        )}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] gap-x-2 gap-y-2 py-2.5 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-rows-1 sm:items-center sm:gap-2.5 sm:px-3 sm:py-2.5">
          <div
            ref={searchFieldRef}
            className={cn(
              "relative col-start-1 row-start-1 min-w-0 w-full max-sm:max-w-[11.5rem] max-sm:justify-self-start",
              searchFocused
                ? "sm:w-[min(20rem,calc(100vw-8rem))] sm:max-w-[20rem] sm:shrink-0 sm:justify-self-start"
                : "sm:max-w-none sm:w-52 sm:shrink-0 md:w-60",
            )}
          >
            <Search
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 z-[2] -translate-y-1/2 text-neutral-400 max-sm:left-3 max-sm:h-[17px] max-sm:w-[17px]",
                searchFocused ? "h-[17px] w-[17px] sm:left-3" : "h-[17px] w-[17px]",
              )}
            />
            <input
              ref={searchInputRef}
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
              onFocus={() => setSearchFocused(true)}
              className={cn(
                "relative z-[1] box-border w-full border-0 bg-neutral-100 py-0 pr-3 text-neutral-800 outline-none ring-0 transition placeholder:text-neutral-500 focus:border-0 focus:bg-neutral-100 focus:outline-none focus:ring-0 focus-visible:ring-0 max-sm:h-[2.375rem] max-sm:pl-9 max-sm:pr-2.5 max-sm:text-[13px] max-sm:leading-[2.375rem]",
                searchFocused
                  ? "h-9 pl-9 text-sm leading-9 sm:h-10 sm:pl-10 sm:pr-3 sm:text-sm sm:leading-10"
                  : "h-9 pl-9 text-sm leading-9 sm:h-10 sm:leading-10",
                MAP_HEADER_CONTROL_ROUNDED,
                showSearchResults && "sm:rounded-b-none sm:border-0 sm:bg-white sm:shadow-none sm:ring-0",
              )}
            />
            {showSearchResults ? (
              <MapSearchResultsPanel
                results={searchResults}
                onSelect={handleSearchSelect}
                attached
                className="absolute inset-x-0 top-full z-[120] mt-0 hidden max-h-[min(26rem,calc(100dvh-5.25rem-env(safe-area-inset-top)))] sm:flex"
              />
            ) : null}
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
            <ProfileLink
              roundedClassName={MAP_HEADER_CONTROL_ROUNDED}
              onOpenProfile={openProfilePanel}
            />
          </div>

          <div
            className={cn(
              "col-span-2 row-start-2 flex min-h-0 w-full min-w-0 items-center gap-1.5 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:justify-start sm:py-0.5 [&::-webkit-scrollbar]:hidden",
              searchFocused && "sm:justify-end",
            )}
          >
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

      {filterModalOpen ? (
        <MapFilterFeedsModal
        open
        onClose={() => setFilterModalOpen(false)}
        panelTopPx={filterPanelTopPx}
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
      ) : null}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 z-0 min-h-0">
          {mapMountReady ? (
            <DealMap
              restaurants={mapRestaurants}
              userCoords={coords}
              selectedId={selectedRestaurantId}
              onSelect={setSelectedRestaurantId}
              flyTo={flyTo}
              routeFrom={selectedRestaurantId ? distanceOrigin : null}
              onMapClick={handleMapClick}
              simpleMapPins={activePriceFilter === "top"}
            />
          ) : (
            <MapLoadingSkeleton />
          )}
        </div>

        {showSearchResults ? (
          <div
            className="pointer-events-none absolute inset-0 z-[40] max-sm:bg-white/0 sm:pointer-events-auto sm:bg-neutral-950/5"
            onClick={dismissSearch}
            role="presentation"
            aria-hidden
          />
        ) : null}

        {showSearchResults ? (
          <div className="sm:hidden">
            <MapSearchResultsMobile
              query={searchQuery.trim()}
              results={searchResults}
              onBack={closeSearch}
              onSelect={handleSearchSelect}
            />
          </div>
        ) : null}

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


        {selected && !sidePanelOpen && !showSearchResults && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[calc(4.85rem+env(safe-area-inset-bottom))] z-40 flex justify-center pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:pl-[max(1rem,env(safe-area-inset-left))] sm:pr-[max(1rem,env(safe-area-inset-right))]">
            <div
              key={selected.id}
              className="pointer-events-auto w-full max-w-[27.25rem] shrink-0 motion-safe:animate-[ghm-map-peek-in_0.34s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none"
            >
              <RestaurantPreviewCard
                restaurant={selected}
                href={routes.restaurant(selected.restaurantId ?? selected.id)}
                onOpen={() => setSidePanelOpen(true)}
                compact
              />
            </div>
          </div>
        )}

        {!sidePanelOpen && !selected && !showSearchResults && (
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

      {profilePanelOpen && (
        <ProfileSidePanel
          anchor={profilePanelAnchor}
          onClose={() => setProfilePanelOpen(false)}
        />
      )}

      {dropFeedOpen ? <DropFeedModal open onClose={() => setDropFeedOpen(false)} /> : null}
    </div>
  );
}
