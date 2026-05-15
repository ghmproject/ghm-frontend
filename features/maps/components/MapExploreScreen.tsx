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
import { useSearchLocationGeocode } from "@/features/maps/hooks/useSearchLocationGeocode";
import { useUserLocation } from "@/features/maps/hooks/useUserLocation";
import { MOCK_RESTAURANTS } from "@/features/restaurants/data/mock-restaurants";
import { RestaurantPreviewCard } from "@/features/restaurants/components/RestaurantPreviewCard";
import {
  filterRestaurants,
  useMapExploreStore,
  withDistances,
} from "@/features/restaurants/store/mapExplore.store";
import { isNearBrisbane, mapCameraCenter } from "@/features/maps/utils/nearBrisbane";
import { cn } from "@/lib/utils/cn";

const ACCENT = "#FF5722";

/** Same corner radius as Filter / Account (map header chrome). */
const MAP_HEADER_CONTROL_ROUNDED = "rounded-2xl";

export function MapExploreScreen() {
  const { coords, state, refresh } = useUserLocation();
  const activePriceFilter = useMapExploreStore((s) => s.activePriceFilter);
  const activeCuisine = useMapExploreStore((s) => s.activeCuisine);
  const showOnlyFeeds = useMapExploreStore((s) => s.showOnlyFeeds);
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

  useSearchLocationGeocode(searchQuery, setSearchLocation);

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
        MOCK_RESTAURANTS,
        activePriceFilter,
        searchQuery,
        searchLocation,
        activeCuisine,
        showOnlyFeeds,
      ),
    [activePriceFilter, activeCuisine, showOnlyFeeds, searchQuery, searchLocation],
  );

  const flyTo = useMemo(
    () =>
      searchLocation ? { lat: searchLocation.lat, lng: searchLocation.lng } : null,
    [searchLocation],
  );

  const distanceOrigin = useMemo(() => {
    if (searchLocation) {
      const pin = { lat: searchLocation.lat, lng: searchLocation.lng };
      if (isNearBrisbane(pin)) return pin;
    }
    return mapCameraCenter(coords);
  }, [coords, searchLocation]);

  const withDist = useMemo(() => withDistances(filtered, distanceOrigin), [filtered, distanceOrigin]);

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
            <Search className="pointer-events-none absolute left-3 top-1/2 z-[2] h-[17px] w-[17px] -translate-y-1/2 text-neutral-400 max-sm:left-2 max-sm:h-4 max-sm:w-4" />
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
                "relative z-[1] box-border h-9 w-full border-0 bg-neutral-100 py-0 pl-9 pr-3 text-sm leading-9 text-neutral-800 outline-none ring-0 transition placeholder:text-neutral-500 focus:bg-white focus:ring-2 focus:ring-[#FF5722]/25 max-sm:h-8 max-sm:pl-8 max-sm:pr-2 max-sm:text-xs max-sm:leading-8 sm:h-10 sm:leading-10",
                MAP_HEADER_CONTROL_ROUNDED,
              )}
            />
          </div>

          <div className="col-start-2 row-start-1 flex min-w-0 shrink-0 items-center gap-1 self-center max-sm:gap-1 sm:col-start-3 sm:row-start-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setFilterModalOpen(true)}
              className={cn(
                "flex h-9 shrink-0 items-center gap-1.5 bg-neutral-100 px-2.5 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-200/90 max-sm:h-8 max-sm:gap-1 max-sm:px-2 max-sm:text-[11px] sm:h-10 sm:px-3",
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
                "flex h-9 w-9 shrink-0 items-center justify-center bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200/90 max-sm:h-8 max-sm:w-8 sm:h-10 sm:w-10",
                MAP_HEADER_CONTROL_ROUNDED,
              )}
              aria-label="Account"
            >
              <User className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2} />
            </button>
          </div>

          <div className="col-span-2 row-start-2 flex min-h-0 w-full min-w-0 items-center gap-1.5 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:py-0.5 [&::-webkit-scrollbar]:hidden">
            {PRICE_FILTER_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActivePriceFilter(chip.id)}
                className={cn(
                  "shrink-0 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-700 sm:px-3 sm:py-2 sm:text-xs",
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
        restaurants={MOCK_RESTAURANTS}
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
          />
        </div>

        {withDist.length === 0 && (
          <div className="pointer-events-auto absolute inset-0 z-[1000] flex items-center justify-center bg-white/75 p-6 backdrop-blur-[2px]">
            <div className="max-w-xs text-center">
              <p className="text-base font-semibold text-neutral-900">No matches</p>
              <p className="mt-2 text-sm leading-snug text-neutral-600">
                {searchQuery.trim()
                  ? `Nothing matches “${searchQuery.trim()}” for this price filter. Try a dish, suburb, or place (e.g. West End).`
                  : "Nothing matches the current price filter."}
              </p>
              {searchQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
                >
                  Clear search
                </button>
              ) : null}
            </div>
          </div>
        )}

        {(state.status === "denied" || state.status === "unavailable") && (
          <div className="pointer-events-auto absolute left-2 right-2 top-2 z-20 flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/98 p-2.5 text-xs text-amber-950 shadow-md backdrop-blur-sm sm:left-3 sm:right-3 sm:p-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div className="min-w-0">
              <p className="font-semibold text-amber-950">Location optional</p>
              <p className="text-amber-900/85">{state.message}</p>
              <button
                type="button"
                onClick={refresh}
                className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-950 shadow-sm"
              >
                <Navigation className="h-3 w-3" />
                Try again
              </button>
            </div>
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
