import { cn } from "@/lib/utils/cn";

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[500]",
        "focus:rounded-xl focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold",
        "focus:text-neutral-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FF5722]/40",
      )}
    >
      Skip to main content
    </a>
  );
}
