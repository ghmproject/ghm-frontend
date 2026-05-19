"use client";

import {
  Check,
  ChevronDown,
  ChevronLeft,
  Crown,
  ExternalLink,
  Flag,
  Heart,
  MapPin,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import { RestaurantCommunityNotesSection } from "@/features/restaurants/components/RestaurantCommunityNotesSection";
import { RestaurantImage } from "@/features/restaurants/components/RestaurantImage";
import type { RestaurantWithDistance } from "@/features/restaurants/types/restaurant";
import { formatDistanceKm } from "@/features/restaurants/utils/distance";
import { formatPriceCompact } from "@/lib/utils/formatCurrency";
import { formatRelativeDay } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils/cn";

const ACCENT = "#FF5722";
/** Above this, distance is treated as unreliable (bad GPS / wrong hemisphere). */
const MAX_DISPLAY_DISTANCE_KM = 20_000;

export type SidePanelAnchor = { topPx: number };

type MapRestaurantSidePanelProps = {
  restaurant: RestaurantWithDistance;
  onClose: () => void;
  anchor?: SidePanelAnchor | null;
  className?: string;
};

function googleMapsSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function MapRestaurantSidePanel({
  restaurant: r,
  onClose,
  anchor = null,
  className,
}: MapRestaurantSidePanelProps) {
  const distRaw = r.distanceKm;
  const dist =
    distRaw != null &&
    Number.isFinite(distRaw) &&
    distRaw >= 0 &&
    distRaw <= MAX_DISPLAY_DISTANCE_KM
      ? formatDistanceKm(distRaw, r.distanceIsDriving ? "drive" : "straight")
      : null;
  const verified = r.priceVerifiedAt
    ? `Price verified ${formatRelativeDay(new Date(r.priceVerifiedAt))}`
    : "Price not yet verified";
  const featured = r.isTopRated || r.isHotDeal;
  const docked = anchor != null;

  const [layoutWide, setLayoutWide] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 640px)").matches : false,
  );
  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => setLayoutWide(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const panel = (
    <>
      <button
        type="button"
        aria-label="Close place details"
        className="fixed inset-0 z-[200] bg-neutral-950/10 animate-[ghm-backdrop-in_0.2s_ease-out] motion-reduce:animate-none"
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed z-[210] flex min-h-0 flex-col overflow-hidden border border-neutral-200/80 bg-neutral-100 motion-safe:animate-[ghm-filter-panel-from-left_0.28s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none",
          docked
            ? cn(
                /* Mobile: true full-screen sheet from top of viewport */
                "left-0 right-0 w-full min-w-0 max-w-none max-sm:rounded-none max-sm:border-x-0 max-sm:border-b-0 max-sm:pt-[env(safe-area-inset-top)] sm:pt-0 shadow-[0_-8px_32px_rgba(0,0,0,0.14)]",
                "sm:inset-x-auto sm:left-[max(1.25rem,env(safe-area-inset-left))] sm:right-[max(1.25rem,env(safe-area-inset-right))] sm:w-auto sm:max-w-[25rem] sm:rounded-t-[28px] sm:border-x sm:border-b sm:border-neutral-200/80 sm:shadow-[0_8px_40px_rgba(0,0,0,0.1),0_2px_12px_rgba(0,0,0,0.05)]",
              )
            : cn(
                "top-0 bottom-0 pt-[env(safe-area-inset-top)] shadow-[8px_0_40px_rgba(0,0,0,0.12)]",
                /* Mobile: edge-to-edge drawer */
                "left-0 w-full min-w-0 max-w-none rounded-none max-sm:border-y-0 max-sm:border-l-0 max-sm:border-r-0",
                "sm:left-[max(1rem,env(safe-area-inset-left))] sm:max-w-[360px] sm:rounded-tr-[1.35rem] sm:w-[min(92vw,21rem)] md:w-[min(34vw,22rem)]",
              ),
          className,
        )}
        style={
          docked && anchor
            ? layoutWide
              ? {
                  top: `max(${anchor.topPx}px, env(safe-area-inset-top))`,
                  bottom: 0,
                }
              : { top: 0, bottom: 0 }
            : undefined
        }
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div
            className={cn(
              "relative h-56 shrink-0 bg-gradient-to-br from-neutral-200 to-neutral-300 sm:h-60",
              docked && "max-sm:rounded-none sm:rounded-t-[28px]",
            )}
          >
            <RestaurantImage
              src={r.imageUrl}
              alt={r.name}
              sizes="(max-width: 640px) 100vw, 400px"
            />
            <div className="absolute left-3 right-3 top-3 z-[1] flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-md transition hover:bg-white"
                aria-label="Close"
              >
                {docked ? (
                  <>
                    <ChevronLeft className="h-5 w-5 sm:hidden" strokeWidth={2.2} aria-hidden />
                    <ChevronDown className="hidden h-5 w-5 sm:block" strokeWidth={2.2} aria-hidden />
                  </>
                ) : (
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.2} aria-hidden />
                )}
              </button>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-md transition hover:bg-white"
                aria-label="Save place"
              >
                <Heart className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-6px_24px_rgba(0,0,0,0.04)] sm:px-5">
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <h2 className="min-w-0 break-words text-[1.625rem] font-bold leading-[1.15] tracking-[-0.03em] text-neutral-900">
                {r.name}
              </h2>
              <p className="shrink-0 text-[1.75rem] font-bold leading-none" style={{ color: ACCENT }}>
                {formatPriceCompact(r.price)}
              </p>
            </div>

            <div className="mt-2.5 flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1 text-sm leading-snug">
              <p className="min-w-0 max-w-full text-neutral-600 sm:max-w-[min(100%,24rem)]">
                {r.suburb}
                {dist ? ` · ${dist}` : ""}
                <span className="whitespace-nowrap">
                  {" "}
                  · <span className="text-amber-500">👍</span> +{r.netScore}
                </span>
              </p>
              <p className="max-w-full shrink-0 text-right text-neutral-700 sm:max-w-[11rem]">{r.dish}</p>
            </div>

            {featured ? (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-400">
                <Crown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                FEATURED
              </p>
            ) : null}

            <p className="mt-4 flex items-start gap-2.5 rounded-2xl bg-white px-3.5 py-3 text-sm leading-snug text-neutral-800 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
              {verified}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white px-2 py-3 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <ThumbsUp className="mx-auto h-5 w-5 text-amber-400" strokeWidth={2} aria-hidden />
                <p className="mt-2 text-xs font-bold text-neutral-900">Worth it</p>
                <p className="mt-1 text-base font-bold tabular-nums text-neutral-900">{r.worthIt}</p>
              </div>
              <div className="rounded-xl bg-white px-2 py-3 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <p className="text-lg font-bold leading-none tabular-nums" style={{ color: ACCENT }}>
                  +{r.netScore}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Net score
                </p>
              </div>
              <div className="rounded-xl bg-white px-2 py-3 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <ThumbsDown className="mx-auto h-5 w-5 text-amber-400" strokeWidth={2} aria-hidden />
                <p className="mt-2 text-xs font-bold text-neutral-900">Overrated</p>
                <p className="mt-1 text-base font-bold tabular-nums text-neutral-900">{r.overrated}</p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex gap-2.5 px-3.5 py-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT }} aria-hidden />
                <p className="text-sm leading-snug text-neutral-800">{r.address}</p>
              </div>
              <a
                href={googleMapsSearchUrl(r.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 px-3.5 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50/90"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-bold text-blue-600">
                    G
                  </span>
                  <span>Open in Google Maps</span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </a>
            </div>

            <RestaurantCommunityNotesSection
              restaurantId={r.id}
              initialNotes={r.communityNotes ?? []}
            />

            <button
              type="button"
              className="mt-6 flex items-center gap-2 text-xs font-medium text-neutral-500 transition hover:text-neutral-700"
            >
              <Flag className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              Flag outdated info
            </button>
          </div>
        </div>
      </aside>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(panel, document.body);
}
