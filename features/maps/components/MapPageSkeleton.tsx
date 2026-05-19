import { MapLoadingSkeleton } from "@/features/maps/components/MapLoadingSkeleton";

/** Full-viewport shell shown while MapExploreScreen chunk loads. */
export function MapPageSkeleton() {
  return (
    <div className="flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-white">
      <header className="shrink-0 border-b border-neutral-200/90 bg-white px-3 py-2.5 pt-[max(0.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-52 max-w-[40%] animate-pulse rounded-2xl bg-neutral-100" />
          <div className="hidden min-w-0 flex-1 gap-1.5 sm:flex">
            <div className="h-9 w-20 animate-pulse rounded-2xl bg-neutral-100" />
            <div className="h-9 w-20 animate-pulse rounded-2xl bg-neutral-100" />
            <div className="h-9 w-16 animate-pulse rounded-2xl bg-neutral-100" />
          </div>
          <div className="ml-auto flex gap-2">
            <div className="h-10 w-20 animate-pulse rounded-2xl bg-neutral-100" />
            <div className="h-10 w-10 animate-pulse rounded-2xl bg-neutral-100" />
          </div>
        </div>
      </header>
      <div className="relative min-h-0 flex-1">
        <MapLoadingSkeleton />
      </div>
    </div>
  );
}
