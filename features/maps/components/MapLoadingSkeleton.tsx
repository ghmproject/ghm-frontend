import { cn } from "@/lib/utils/cn";

type MapLoadingSkeletonProps = {
  className?: string;
};

/** Lightweight placeholder while map JS / tiles load. */
export function MapLoadingSkeleton({ className }: MapLoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "relative h-full min-h-0 w-full overflow-hidden bg-[#eceae6]",
        className,
      )}
      role="status"
      aria-label="Loading map"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#e8e6e1] via-[#eceae6] to-[#e0ddd8]" />
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-[18%] top-[22%] h-px w-[64%] rotate-[12deg] bg-neutral-400/35" />
        <div className="absolute left-[12%] top-[48%] h-px w-[72%] -rotate-[6deg] bg-neutral-400/30" />
        <div className="absolute left-[28%] top-[62%] h-px w-[48%] rotate-[3deg] bg-neutral-400/25" />
      </div>
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm font-medium text-neutral-500">
        Loading map…
      </p>
    </div>
  );
}
