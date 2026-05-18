"use client";

import type { RouteOption } from "@/features/maps/types/drivingRoute";
import { formatRouteSummary } from "@/features/maps/utils/formatRouteSummary";
import { cn } from "@/lib/utils/cn";

type MapRoutePickerProps = {
  options: RouteOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function MapRoutePicker({ options, selectedIndex, onSelect }: MapRoutePickerProps) {
  if (options.length === 0) return null;

  return (
    <div
      className="pointer-events-auto absolute left-3 top-3 z-[8] w-[min(calc(100%-1.5rem),280px)] overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
      role="listbox"
      aria-label="Driving routes"
    >
      {options.map((opt, i) => {
        const selected = i === selectedIndex;
        return (
          <button
            key={opt.id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onSelect(i)}
            className={cn(
              "flex w-full gap-3 px-4 py-3.5 text-left transition-colors",
              selected ? "bg-blue-50" : "bg-white hover:bg-neutral-50",
              i > 0 && "border-t border-neutral-100",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2",
                selected ? "border-blue-600 bg-blue-600" : "border-neutral-300 bg-white",
              )}
              aria-hidden
            >
              {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-neutral-900">{opt.title}</span>
              <span
                className={cn(
                  "mt-0.5 block text-sm",
                  selected ? "font-medium text-blue-600" : "text-neutral-600",
                )}
              >
                {formatRouteSummary(opt.distanceKm, opt.durationMin)}
              </span>
              {opt.hint && (
                <span className="mt-0.5 block text-xs text-neutral-500">{opt.hint}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
