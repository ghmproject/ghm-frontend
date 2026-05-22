"use client";

import { Check, Flame, RotateCcw, Star, X } from "lucide-react";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { PRICE_FILTER_CHIPS } from "@/constants/filters";
import { useFilterFeedsPreview } from "@/features/maps/hooks/useFilterFeedsPreview";
import type { SearchLocationHit } from "@/features/restaurants/store/mapExplore.store";
import type {
  CuisineFilterId,
  LatLng,
  PriceFilterId,
  ShowOnlyFeedsId,
} from "@/features/restaurants/types/restaurant";
import { cn } from "@/lib/utils/cn";

const ACCENT = "#FF5722";
const ACCENT_SOFT = "rgba(255, 87, 34, 0.09)";
const CHIP_INACTIVE_BG = "#F3F4F6";

const MAX_PRICE_IDS = ["u15", "u12", "u8", "u5"] as const satisfies readonly PriceFilterId[];

const CUISINE_CHIPS: { id: CuisineFilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "vietnamese", label: "Vietnamese" },
  { id: "thai", label: "Thai" },
  { id: "korean", label: "Korean" },
  { id: "indian", label: "Indian" },
  { id: "bakery", label: "Bakery" },
  { id: "burgers", label: "Burgers" },
];

const DEFAULT_FILTER_PRICE = "u12" as const satisfies (typeof MAX_PRICE_IDS)[number];
const DEFAULT_FILTER_CUISINE = "all" as const satisfies CuisineFilterId;
const DEFAULT_FILTER_SHOW = "all" as const satisfies ShowOnlyFeedsId;

const SHOW_ROWS: {
  id: Exclude<ShowOnlyFeedsId, "all">;
  title: string;
  kind: "flame" | "verified" | "star";
}[] = [
  { id: "hotDeals", title: "Hot Deals (live specials)", kind: "flame" },
  { id: "verified", title: "Price verified in last 30 days", kind: "verified" },
  { id: "top50", title: "Top rated (vote score 50+)", kind: "star" },
];

function isModalPriceId(id: PriceFilterId): id is (typeof MAX_PRICE_IDS)[number] {
  return (MAX_PRICE_IDS as readonly string[]).includes(id);
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-2xl px-3 py-2 text-[13px] font-semibold leading-none tracking-tight transition-colors max-sm:px-2.5 max-sm:py-1.5 max-sm:text-[12px]",
        active
          ? "text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
          : "text-neutral-700 hover:bg-neutral-200/85 hover:text-neutral-800",
      )}
      style={active ? { backgroundColor: ACCENT } : { backgroundColor: CHIP_INACTIVE_BG }}
    >
      {children}
    </button>
  );
}

function ShowOnlyRowIcon({ kind, selected }: { kind: "flame" | "verified" | "star"; selected: boolean }) {
  if (kind === "flame") {
    return (
      <Flame
        className="h-[19px] w-[19px] shrink-0"
        strokeWidth={2.35}
        style={
          selected
            ? { color: ACCENT, fill: "rgba(255, 87, 34, 0.22)" }
            : { color: "#EA580C", fill: "rgba(234, 88, 12, 0.15)" }
        }
        aria-hidden
      />
    );
  }
  if (kind === "verified") {
    if (selected) {
      return (
        <Check className="h-[19px] w-[19px] shrink-0" strokeWidth={2.35} style={{ color: ACCENT }} aria-hidden />
      );
    }
    return (
      <span
        className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md bg-emerald-500 text-white shadow-[0_1px_2px_rgba(16,185,129,0.35)]"
        aria-hidden
      >
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
    );
  }
  return (
    <Star
      className={cn("h-[19px] w-[19px] shrink-0", selected ? "" : "fill-transparent")}
      strokeWidth={2.35}
      style={
        selected
          ? { color: ACCENT, fill: "rgba(255, 87, 34, 0.18)" }
          : { color: "#CA8A04", fill: "transparent" }
      }
      aria-hidden
    />
  );
}

function ShowOnlyRow({
  title,
  kind,
  selected,
  onClick,
}: {
  title: string;
  kind: "flame" | "verified" | "star";
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-[background-color,border-color,box-shadow] duration-150 max-sm:gap-2.5 max-sm:px-3 max-sm:py-2.5 [@media(max-height:640px)]:py-2.5",
        selected
          ? "shadow-[0_1px_0_rgba(0,0,0,0.03)]"
          : "border-neutral-200 bg-white hover:border-neutral-300/90 hover:bg-neutral-50/60",
      )}
      style={
        selected
          ? {
              borderColor: ACCENT,
              backgroundColor: ACCENT_SOFT,
            }
          : undefined
      }
    >
      <ShowOnlyRowIcon kind={kind} selected={selected} />
      <span
        className={cn(
          "flex-1 text-left text-[15px] font-semibold leading-snug tracking-[-0.01em] max-sm:text-[14px]",
          !(kind === "flame" && selected) && "text-neutral-900",
        )}
        style={kind === "flame" && selected ? { color: ACCENT } : undefined}
      >
        {title}
      </span>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
        {selected ? (
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]"
            style={{ backgroundColor: ACCENT }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        ) : (
          <span className="h-5 w-5 rounded-full border-2 border-neutral-200 bg-white" />
        )}
      </span>
    </button>
  );
}

export type MapFilterFeedsModalProps = {
  open: boolean;
  onClose: () => void;
  /** Desktop: aligns panel top with the map search row. */
  panelTopPx?: number | null;
  searchCenter: LatLng;
  searchQuery: string;
  searchLocation: SearchLocationHit | null;
  activePriceFilter: PriceFilterId;
  activeCuisine: CuisineFilterId;
  showOnlyFeeds: ShowOnlyFeedsId;
  onApply: (p: {
    price: (typeof MAX_PRICE_IDS)[number];
    cuisine: CuisineFilterId;
    show: ShowOnlyFeedsId;
  }) => void;
};

export function MapFilterFeedsModal({
  open,
  onClose,
  panelTopPx = null,
  searchCenter,
  searchQuery,
  searchLocation,
  activePriceFilter,
  activeCuisine,
  showOnlyFeeds,
  onApply,
}: MapFilterFeedsModalProps) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 640px)").matches : false,
  );

  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const [draftPrice, setDraftPrice] = useState<(typeof MAX_PRICE_IDS)[number]>(DEFAULT_FILTER_PRICE);
  const [draftCuisine, setDraftCuisine] = useState<CuisineFilterId>(DEFAULT_FILTER_CUISINE);
  const [draftShow, setDraftShow] = useState<ShowOnlyFeedsId>(DEFAULT_FILTER_SHOW);

  const resetAllFilters = () => {
    setDraftPrice(DEFAULT_FILTER_PRICE);
    setDraftCuisine(DEFAULT_FILTER_CUISINE);
    setDraftShow(DEFAULT_FILTER_SHOW);
    onApply({
      price: DEFAULT_FILTER_PRICE,
      cuisine: DEFAULT_FILTER_CUISINE,
      show: DEFAULT_FILTER_SHOW,
    });
  };

  useEffect(() => {
    if (!open) return;
    setDraftPrice(isModalPriceId(activePriceFilter) ? activePriceFilter : DEFAULT_FILTER_PRICE);
    setDraftCuisine(activeCuisine);
    setDraftShow(showOnlyFeeds);
  }, [open, activePriceFilter, activeCuisine, showOnlyFeeds]);

  const { count, isLoading: countLoading } = useFilterFeedsPreview({
    open,
    searchCenter,
    draftPrice,
    draftCuisine,
    draftShow,
    searchQuery,
    searchLocation,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const priceChips = PRICE_FILTER_CHIPS.filter((c) => c.id !== "top");

  const desktopPanelStyle =
    isDesktop && panelTopPx != null ? { top: Math.max(panelTopPx, 10) } : undefined;

  const ui = (
    <>
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        className="fixed inset-0 z-[200] bg-neutral-950/10 animate-[ghm-backdrop-in_0.2s_ease-out] motion-reduce:animate-none max-sm:bg-neutral-950/40"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-feeds-title"
        className={cn(
          "fixed z-[210] flex flex-col overflow-hidden bg-white",
          /* Mobile: bottom sheet */
          "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:w-full max-sm:max-w-none",
          "max-sm:max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)))]",
          "max-sm:rounded-t-[1.75rem] max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0 max-sm:border-t max-sm:border-neutral-200/80",
          "max-sm:shadow-[0_-8px_40px_rgba(0,0,0,0.12),0_-2px_12px_rgba(0,0,0,0.06)]",
          "max-sm:motion-safe:animate-[ghm-sheet-from-bottom_0.32s_cubic-bezier(0.22,1,0.36,1)_both] max-sm:motion-reduce:animate-none",
          /* Desktop: floating panel */
          "sm:w-[min(25rem,calc(100vw-1.5rem))] sm:max-w-[25rem]",
          "sm:max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem)]",
          "sm:rounded-3xl sm:border sm:border-neutral-200/80",
          "sm:shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_12px_rgba(0,0,0,0.05)]",
          "sm:left-[max(1.25rem,env(safe-area-inset-left))] sm:right-auto sm:top-[max(1.5rem,calc(env(safe-area-inset-top)+1rem))] sm:h-auto sm:translate-none",
          "sm:motion-safe:animate-[ghm-filter-panel-from-left_0.28s_cubic-bezier(0.22,1,0.36,1)_both] sm:motion-reduce:animate-none",
        )}
        style={desktopPanelStyle}
      >
        <div
          className="hidden max-sm:flex shrink-0 justify-center pt-2.5"
          aria-hidden
        >
          <span className="h-1 w-10 rounded-full bg-neutral-300" />
        </div>

        <header className="relative shrink-0 px-6 pb-4 pt-5 max-sm:px-4 max-sm:pb-3 max-sm:pt-2 [@media(max-height:640px)]:pb-3 [@media(max-height:640px)]:pt-4 sm:pt-5">
          <div className="absolute right-4 top-4 flex items-center gap-1.5 sm:right-5 sm:top-5">
            <button
              type="button"
              onClick={resetAllFilters}
              className="flex h-8 w-8 items-center justify-center rounded-full transition hover:brightness-[1.03] active:scale-[0.98]"
              style={{ backgroundColor: ACCENT_SOFT, color: ACCENT }}
              aria-label="Reset filters"
            >
              <RotateCcw className="h-[15px] w-[15px]" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200/90 hover:text-neutral-700 max-sm:hidden"
              aria-label="Close filters"
            >
              <X className="h-[15px] w-[15px]" strokeWidth={2} />
            </button>
          </div>
          <h2
            id="filter-feeds-title"
            className="pr-[4.75rem] text-[26px] font-bold leading-[1.15] tracking-[-0.025em] text-neutral-900 max-sm:pr-11 max-sm:text-[22px]"
          >
            Filter feeds
          </h2>
          <p className="mt-1 text-[14px] font-normal leading-snug text-neutral-500 max-sm:text-[13px]">
            {"Spoiler: it's cheap."}
          </p>
        </header>

        <div className="ghm-scrollbar-hidden flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pb-2 max-sm:gap-4 max-sm:px-4 sm:flex-none sm:shrink-0 sm:overflow-hidden [@media(max-height:700px)]:gap-4 [@media(max-height:640px)]:gap-3">
          <section>
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400 max-sm:mb-2 max-sm:text-[9px]">
              MAX PRICE
            </p>
            <div className="flex flex-nowrap gap-2 overflow-x-auto">
              {priceChips.map((chip) => (
                <FilterChip
                  key={chip.id}
                  active={draftPrice === chip.id}
                  onClick={() => setDraftPrice(chip.id as (typeof MAX_PRICE_IDS)[number])}
                >
                  {chip.label}
                </FilterChip>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400 max-sm:mb-2 max-sm:text-[9px]">
              CUISINE
            </p>
            <div className="flex flex-wrap gap-2">
              {CUISINE_CHIPS.map((chip) => (
                <FilterChip
                  key={chip.id}
                  active={draftCuisine === chip.id}
                  onClick={() => setDraftCuisine(chip.id)}
                >
                  {chip.label}
                </FilterChip>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400 max-sm:mb-2 max-sm:text-[9px]">
              SHOW ONLY
            </p>
            <div className="flex flex-col gap-2 max-sm:gap-1.5">
              {SHOW_ROWS.map(({ id, title, kind }) => (
                <ShowOnlyRow
                  key={id}
                  title={title}
                  kind={kind}
                  selected={draftShow === id}
                  onClick={() => setDraftShow(id)}
                />
              ))}
            </div>
          </section>
        </div>

        <footer className="shrink-0 border-t border-neutral-100 px-6 pb-6 pt-4 max-sm:px-4 max-sm:pt-3 max-sm:pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:border-t-0">
          <button
            type="button"
            onClick={() => {
              onApply({ price: draftPrice, cuisine: draftCuisine, show: draftShow });
              onClose();
            }}
            className="flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-semibold leading-snug tracking-[-0.01em] text-white shadow-[0_4px_14px_rgba(255,87,34,0.38)] transition hover:brightness-[1.03] active:scale-[0.99] max-sm:h-11 max-sm:text-[14px]"
            style={{ backgroundColor: ACCENT }}
          >
            {countLoading ? "Loading…" : `Show ${count} ${count === 1 ? "Feed" : "Feeds"}`}
          </button>
        </footer>
      </div>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(ui, document.body);
}
