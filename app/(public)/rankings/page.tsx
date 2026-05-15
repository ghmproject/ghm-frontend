"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, PenLine, ThumbsUp } from "lucide-react";

import { siteConfig } from "@/config/site";
import { routes } from "@/config/routes";
import { MOCK_RESTAURANTS } from "@/features/restaurants/data/mock-restaurants";
import { formatPriceCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils/cn";

const ACCENT = "#FF5722";
const PAGE_BG = "#fff9f2";
const VOTE_YELLOW = "#facc15";

const FILTER_LABELS = ["Near me", "CBD", "West End", "Fortitude Valley", "Price checks"] as const;

const DEMO_DISTANCES = ["500m", "850m", "320m", "1.2km", "650m", "780m", "240m", "910m"];

function demoDistanceForIndex(i: number) {
  return DEMO_DISTANCES[i % DEMO_DISTANCES.length];
}

export default function RankingsPage() {
  const ranked = [...MOCK_RESTAURANTS].sort((a, b) => b.netScore - a.netScore);
  const [activeFilter, setActiveFilter] = useState(0);

  return (
    <div
      className="min-h-[100dvh] w-full min-w-0 overflow-x-hidden pb-[max(5.5rem,env(safe-area-inset-bottom)+4.5rem)]"
      style={{ backgroundColor: PAGE_BG }}
    >
      <header
        className={cn(
          "sticky top-0 z-10 backdrop-blur-md",
          "bg-[#fff9f2]/95 pt-[max(1rem,env(safe-area-inset-top))]",
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
          <Link
            href={routes.map}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200/90 bg-white shadow-sm transition hover:bg-neutral-50"
            aria-label="Drop a find on the map"
          >
            <PenLine className="h-5 w-5 text-neutral-700" />
          </Link>
        </div>
        <div className="mx-auto mt-5 w-full min-w-0 max-w-xl px-4 sm:mt-6 sm:px-5">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.65rem]">Top cheap eats</h2>
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
          {FILTER_LABELS.map((label, i) => {
            const active = i === activeFilter;
            return (
              <button
                key={label}
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
                {label}
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex gap-3 rounded-2xl border border-orange-200/65 bg-orange-50/85 p-4 shadow-sm sm:mb-5">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-red-600" strokeWidth={2} aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">Near you · South Brisbane</p>
            <p className="mt-1 text-xs leading-snug text-neutral-600 sm:text-sm">
              Top 10 within 2km, voted by 800+ locals
            </p>
          </div>
        </div>

        <ol className="w-full">
          {ranked.map((r, index) => (
            <li
              key={r.id}
              className="border-neutral-300/40 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-dotted"
            >
              <Link
                href={routes.restaurant(r.id)}
                className={cn(
                  "group flex items-center gap-3.5 px-0 py-4 transition-colors",
                  "hover:bg-neutral-900/[0.02] sm:gap-4 sm:py-[1.125rem]",
                )}
              >
                <div
                  className={cn(
                    "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-neutral-200/70 bg-white",
                    "shadow-[0_1px_3px_rgba(0,0,0,0.07)] sm:h-[4.75rem] sm:w-[4.75rem] sm:rounded-[1.125rem]",
                  )}
                  aria-hidden
                >
                  <span
                    className="text-[1.65rem] font-bold leading-none tracking-tight sm:text-[2rem]"
                    style={{ color: ACCENT }}
                  >
                    {index + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                    <span className="text-[15px] font-bold tracking-tight text-neutral-900 sm:text-base">{r.name}</span>
                    <span className="text-sm font-medium tabular-nums text-neutral-500">
                      · {demoDistanceForIndex(index)}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-neutral-500 sm:text-sm">{r.dish}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-bold text-neutral-900 sm:text-sm">{r.suburb}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1.5 text-xs font-bold shadow-sm">
                      <ThumbsUp className="h-3.5 w-3.5 shrink-0" aria-hidden style={{ color: VOTE_YELLOW }} />
                      <span className="tabular-nums" style={{ color: VOTE_YELLOW }}>
                        +{r.netScore}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="shrink-0 self-center pl-1 text-right">
                  <span className="text-2xl font-bold leading-none tabular-nums tracking-tight sm:text-[1.75rem]" style={{ color: ACCENT }}>
                    {formatPriceCompact(r.price)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
