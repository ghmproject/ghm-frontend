"use client";

import { Camera, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import type { CuisineFilterId } from "@/features/restaurants/types/restaurant";
import { cn } from "@/lib/utils/cn";

const ACCENT = "#FF5722";

const CUISINE_OPTIONS: { id: Exclude<CuisineFilterId, "all">; label: string }[] = [
  { id: "vietnamese", label: "Vietnamese" },
  { id: "thai", label: "Thai" },
  { id: "korean", label: "Korean" },
  { id: "indian", label: "Indian" },
  { id: "bakery", label: "Bakery" },
  { id: "burgers", label: "Burgers" },
];

const fieldClass =
  "w-full rounded-2xl border-0 bg-orange-50/70 px-4 py-3 text-sm text-neutral-900 outline-none ring-0 transition placeholder:text-neutral-400 focus:bg-orange-50 focus:ring-2 focus:ring-[#FF5722]/25";

const labelClass =
  "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500";

function RequiredMark() {
  return (
    <span className="ml-0.5 font-semibold text-red-600" aria-hidden="true">
      *
    </span>
  );
}

export type DropFeedModalProps = {
  open: boolean;
  onClose: () => void;
};

export function DropFeedModal({ open, onClose }: DropFeedModalProps) {
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [price, setPrice] = useState("");
  const [dish, setDish] = useState("");
  const [cuisine, setCuisine] = useState<Exclude<CuisineFilterId, "all">>("vietnamese");
  const [photoName, setPhotoName] = useState<string | null>(null);

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

  useEffect(() => {
    if (!open) {
      setRestaurantName("");
      setSuburb("");
      setPrice("");
      setDish("");
      setCuisine("vietnamese");
      setPhotoName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  if (!open) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Demo — wire to API / Supabase later
    console.info("Drop feed:", {
      restaurantName,
      suburb,
      price,
      dish,
      cuisine,
      photo: photoName,
    });
    onClose();
  };

  const ui = (
    <>
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        className={cn(
          "fixed inset-0 z-[9998] bg-neutral-950/40 transition-opacity motion-reduce:transition-none",
          "max-sm:bg-neutral-950/25 sm:bg-neutral-950/40",
        )}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "fixed z-[9999] flex flex-col overflow-hidden bg-white shadow-xl",
          /* Mobile: full screen so full form + safe areas fit (scroll inside) */
          "max-sm:inset-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-full max-sm:rounded-none",
          /* Desktop: centered card, slightly lower than dead-center */
          "sm:left-1/2 sm:top-[calc(50%+0.75rem)] sm:h-auto sm:max-h-[min(92dvh,44rem)] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:border-neutral-200/80 sm:shadow-[0_8px_40px_rgba(0,0,0,0.12)]",
        )}
      >
        <header className="shrink-0  px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pb-5 sm:pt-6">
          <div className="flex flex-col gap-5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.65rem]">
                Drop a feed
              </h2>
              <p className="mt-1 text-sm leading-snug text-neutral-500">
                Share a cheap gem. We&apos;ll check it out and get it on the map.
              </p>
            </div>
          </div>
        </header>

        <form
          onSubmit={onSubmit}
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] max-sm:pt-0 sm:px-6 sm:pb-6",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          <div className="flex flex-col gap-4 py-4 sm:gap-5 sm:py-5">
            <div>
              <label htmlFor="drop-restaurant" className={labelClass}>
                Restaurant name
                <RequiredMark />
              </label>
              <input
                id="drop-restaurant"
                name="restaurant"
                type="text"
                autoComplete="organization"
                placeholder="e.g. Jack's Kebabs"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className={fieldClass}
                required
              />
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_min(7.25rem,30%)] gap-3 max-[380px]:grid-cols-1">
              <div className="min-w-0">
                <label htmlFor="drop-suburb" className={labelClass}>
                  Suburb / area
                  <RequiredMark />
                </label>
                <input
                  id="drop-suburb"
                  name="suburb"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="West End"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  className={fieldClass}
                  required
                />
              </div>
              <div className="min-w-0">
                <label htmlFor="drop-price" className={labelClass}>
                  Price
                  <RequiredMark />
                </label>
                <input
                  id="drop-price"
                  name="price"
                  type="text"
                  inputMode="decimal"
                  placeholder="$8"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={fieldClass}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="drop-dish" className={labelClass}>
                Dish name
                <RequiredMark />
              </label>
              <input
                id="drop-dish"
                name="dish"
                type="text"
                autoComplete="off"
                placeholder="Pork Banh Mi"
                value={dish}
                onChange={(e) => setDish(e.target.value)}
                className={fieldClass}
                required
              />
            </div>

            <div>
              <label htmlFor="drop-cuisine" className={labelClass}>
                Cuisine
                <RequiredMark />
              </label>
              <select
                id="drop-cuisine"
                name="cuisine"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value as Exclude<CuisineFilterId, "all">)}
                className={cn(fieldClass, "cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10")}
                required
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                }}
              >
                {CUISINE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="drop-photo" className={labelClass}>
                Photo
                <RequiredMark />
              </label>
              <input
                id="drop-photo"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                required
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setPhotoName(f?.name ?? null);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex min-h-[8.5rem] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-200/90 bg-orange-50/40 px-4 py-6 text-sm text-neutral-500 transition hover:border-neutral-300 hover:bg-orange-50/70",
                )}
              >
                <Camera className="h-8 w-8 text-neutral-400" strokeWidth={1.5} />
                <span>{photoName ? photoName : "Tap to add a photo"}</span>
              </button>
            </div>

            <div className="shrink-0 border-t border-neutral-100 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:border-neutral-100/90 sm:pt-5 sm:pb-0">
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(255,87,34,0.35)] transition hover:brightness-105 active:scale-[0.99] sm:h-11 sm:text-sm"
                style={{ backgroundColor: ACCENT }}
              >
                Drop the feed
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(ui, document.body);
}
