"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";

import { getRestaurantRankings } from "@/api/routes/ranking.api";
import { DropFeedPenButton } from "@/components/layout/DropFeedPenButton";
import { PUBLIC_PAGE_HEADER_PT } from "@/components/layout/PublicListPageShell";
import { siteConfig } from "@/config/site";
import { useDrivingDistances } from "@/features/maps/hooks/useDrivingDistances";
import { RankingRestaurantCard } from "@/features/rankings/components/RankingRestaurantCard";
import { useRankingFilters } from "@/features/rankings/hooks/useRankingFilters";
import { getRankingBannerSubtitle } from "@/features/rankings/lib/rankingDisplay";
import { rankingRowsToDrivingRestaurants } from "@/features/rankings/lib/rankingRowsForDriving";
import { syncTopRatedRanking } from "@/lib/rankings/topRatedRankingStorage";
import { useUserLocation } from "@/features/maps/hooks/useUserLocation";
import { cn } from "@/lib/utils/cn";

const ACCENT = "#FF5722";
const PAGE_BG = "#fff9f2";
const NEAR_ME_RADIUS_KM = 2;
const RANKING_LIMIT = 10;

export default function RankingsPage() {
  const [activeFilter, setActiveFilter] = useState(0);
  const { filters } = useRankingFilters();
  const { coords, state: locationState, refresh: refreshLocation } = useUserLocation();

  const filter = filters[activeFilter] ?? filters[0];
  const nearMeActive = Boolean(filter?.nearMe);
  const canFetchRankings = !nearMeActive || coords != null;

  useEffect(() => {
    if (activeFilter >= filters.length) setActiveFilter(0);
  }, [activeFilter, filters.length]);

  useEffect(() => {
    if (nearMeActive && !coords && locationState.status !== "loading") {
      refreshLocation();
    }
  }, [nearMeActive, coords, locationState.status, refreshLocation]);

  const {
    data: rankingRes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "ranking-restaurants",
      filter?.id,
      filter?.sortBy,
      filter?.suburb,
      nearMeActive,
      coords?.lat,
      coords?.lng,
    ],
    queryFn: () =>
      getRestaurantRankings({
        sortBy: filter.sortBy,
        suburb: filter.suburb,
        limit: RANKING_LIMIT,
        lat: nearMeActive ? coords?.lat : undefined,
        lng: nearMeActive ? coords?.lng : undefined,
        radiusKm: nearMeActive ? NEAR_ME_RADIUS_KM : undefined,
      }),
    enabled: Boolean(filter) && canFetchRankings,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const rows = rankingRes?.data ?? [];
  const apiSortBy = rankingRes?.sortBy ?? filter?.sortBy ?? "votes";

  const drivingTargets = useMemo(() => rankingRowsToDrivingRestaurants(rows), [rows]);
  const { drivingKmById } = useDrivingDistances(coords, drivingTargets, {
    enabled: coords != null && drivingTargets.length > 0,
  });

  useEffect(() => {
    if (rows.length > 0 && apiSortBy === "popularity") {
      syncTopRatedRanking(rows);
    }
  }, [rows, apiSortBy]);

  const contextBanner = useMemo(() => {
    if (!rankingRes?.context) {
      return { title: "Top cheap eats", subtitle: "Highest scores first" };
    }
    const { label, nearMe, radiusKm } = rankingRes.context;
    const areaLabel = filter?.label === "Near me" ? "Near you" : label;
    return {
      title: `${areaLabel} · Top ${rankingRes.count}`,
      subtitle: getRankingBannerSubtitle(apiSortBy, { nearMe, radiusKm }),
    };
  }, [rankingRes, apiSortBy, filter?.label]);

  return (
    <div
      className="min-h-[100dvh] w-full min-w-0 overflow-x-hidden pb-[max(5.5rem,env(safe-area-inset-bottom)+4.5rem)]"
      style={{ backgroundColor: PAGE_BG }}
    >
      <header
        className={cn(
          "sticky top-0 z-10 backdrop-blur-md",
          "bg-[#fff9f2]/95",
          PUBLIC_PAGE_HEADER_PT,
        )}
      >
        <div className="mx-auto flex w-full min-w-0 max-w-xl items-start justify-between gap-3 px-4 sm:px-5">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-1 ring-black/[0.04]"
              style={{ backgroundColor: ACCENT }}
            >
              <span className="text-lg font-bold">G</span>
            </div>
            <div className="min-w-0 pt-0.5">
              <h1 className="text-base font-bold leading-snug text-neutral-900">{siteConfig.name}</h1>
              <p className="text-xs text-neutral-500 sm:text-sm">{siteConfig.tagline}</p>
            </div>
          </div>
          <DropFeedPenButton />
        </div>
        <div className="mx-auto mt-5 w-full min-w-0 max-w-xl px-4 sm:mt-6 sm:px-5">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.65rem]">
            Top cheap eats
          </h2>
          <p className="mt-1 inline-block w-fit max-w-full text-balance text-sm leading-snug text-neutral-600">
            Ranked by the community. No corporate sell-outs.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-xl px-4 pb-6 pt-5 sm:px-5">
        <div
          className={cn(
            "mb-4 flex w-full min-w-0 gap-2 sm:mb-5 sm:gap-1.5",
            "max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:overscroll-x-contain max-sm:pb-1",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "sm:flex-nowrap",
          )}
        >
          {filters.map((item, i) => {
            const active = i === activeFilter;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveFilter(i)}
                aria-pressed={active}
                className={cn(
                  "shrink-0 cursor-pointer rounded-full px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5722]/35",
                  "sm:min-w-0 sm:flex-1 sm:px-2 sm:py-2.5 sm:text-center sm:text-[11px]",
                  active
                    ? "text-white shadow-md shadow-orange-500/20"
                    : "border border-neutral-200/90 bg-white text-neutral-700 shadow-sm hover:border-neutral-300 hover:bg-neutral-50/80",
                )}
                style={active ? { backgroundColor: ACCENT } : undefined}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex gap-3 rounded-2xl border border-orange-200/65 bg-orange-50/85 p-4 shadow-sm sm:mb-5">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-red-600" strokeWidth={2} aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">{contextBanner.title}</p>
            <p className="mt-1 text-xs leading-snug text-neutral-600 sm:text-sm">
              {contextBanner.subtitle}
            </p>
          </div>
        </div>

        {nearMeActive && !canFetchRankings ? (
          <div className="mb-4 rounded-2xl border border-neutral-200/90 bg-white px-4 py-5 text-center shadow-sm">
            <p className="text-sm text-neutral-700">
              {locationState.status === "loading"
                ? "Getting your location…"
                : locationState.status === "denied"
                  ? "Enable location to see rankings near you."
                  : "Turn on location to see what's nearby."}
            </p>
            {locationState.status !== "loading" ? (
              <button
                type="button"
                onClick={refreshLocation}
                className="mt-3 rounded-full px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: ACCENT }}
              >
                Enable location
              </button>
            ) : null}
          </div>
        ) : null}

        <ol className="w-full">
          {canFetchRankings && isLoading ? (
            <li className="py-8 text-center text-sm text-neutral-500">Loading rankings…</li>
          ) : null}
          {canFetchRankings && isError ? (
            <li className="py-8 text-center text-sm text-red-600">
              Could not load rankings. Try again later.
            </li>
          ) : null}
          {canFetchRankings && !isLoading && !isError && rows.length === 0 ? (
            <li className="py-8 text-center text-sm text-neutral-500">
              No ranked spots in this area yet.
            </li>
          ) : null}
          {canFetchRankings && !isLoading && !isError
            ? rows.map((row) => (
                <li
                  key={row.restaurantId}
                  className="border-b border-neutral-200"
                >
                  <RankingRestaurantCard
                    row={row}
                    userCoords={coords}
                    drivingKm={drivingKmById[String(row.restaurantId)]}
                  />
                </li>
              ))
            : null}
        </ol>
      </main>
    </div>
  );
}
