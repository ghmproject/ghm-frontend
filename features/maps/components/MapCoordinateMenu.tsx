"use client";

import { Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  copyTextToClipboard,
  formatMapCoordinates,
} from "@/features/maps/utils/formatCoordinates";

export type MapCoordinateMenuState = {
  x: number;
  y: number;
  lat: number;
  lng: number;
};

type MapCoordinateMenuProps = {
  menu: MapCoordinateMenuState | null;
  onClose: () => void;
};

export function MapCoordinateMenu({ menu, onClose }: MapCoordinateMenuProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [menu?.lat, menu?.lng, menu?.x, menu?.y]);

  useEffect(() => {
    if (!menu) return;
    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-map-coord-menu]")) return;
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menu, onClose]);

  const copy = useCallback(async () => {
    if (!menu) return;
    const text = formatMapCoordinates(menu.lat, menu.lng);
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(onClose, 1200);
    }
  }, [menu, onClose]);

  if (!menu) return null;

  const label = formatMapCoordinates(menu.lat, menu.lng);

  return (
    <button
      type="button"
      data-map-coord-menu
      className="fixed z-[1000] min-w-[248px] max-w-[min(92vw,320px)] cursor-pointer overflow-hidden rounded-xl border border-black/[0.08] bg-white text-left shadow-[0_4px_20px_rgba(0,0,0,0.14)] transition hover:bg-neutral-50/80"
      style={{ left: menu.x + 10, top: menu.y - 6 }}
      onClick={() => void copy()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        <Copy className="h-4 w-4 shrink-0 text-neutral-500" strokeWidth={2} aria-hidden />
        <span className="truncate font-mono text-[13px] font-medium tracking-tight text-neutral-900">
          {label}
        </span>
      </div>
      <div className="border-t border-neutral-100" aria-hidden />
      <p className="px-3.5 py-2 text-xs text-neutral-500">
        {copied ? "Copied to clipboard" : "Click to copy coordinates"}
      </p>
    </button>
  );
}
