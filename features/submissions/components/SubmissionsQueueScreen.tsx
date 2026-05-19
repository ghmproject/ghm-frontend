"use client";

import { Flag, ThumbsDown, ThumbsUp, Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { PUBLIC_PAGE_HEADER_PT } from "@/components/layout/PublicListPageShell";
import { routes } from "@/config/routes";
import {
  FLAGGED_LISTINGS,
  PENDING_SUBMISSIONS,
  type PendingSubmission,
} from "@/features/submissions/data/mock-submissions";
import { FeaturedListingsSection } from "@/features/submissions/components/FeaturedListingsSection";
import { formatPriceCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils/cn";

const ACCENT = "#FF5722";
const PAGE_BG = "#fff9f2";

function PendingCard({
  item,
  onApprove,
  onReject,
}: {
  item: PendingSubmission;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm">
      <div className="h-16 w-16 shrink-0 rounded-xl bg-neutral-200/80" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-neutral-900">
          <span>{item.restaurant}</span>
          <span className="font-bold" style={{ color: ACCENT }}>
            {" "}
            · {formatPriceCompact(item.price)}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-neutral-600">{item.dish}</p>
        <p className="mt-1 text-xs font-bold text-neutral-900">{item.suburb}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <button
          type="button"
          onClick={() => onApprove(item.id)}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100/80"
        >
          <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
          Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(item.id)}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
        >
          <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
          Reject
        </button>
      </div>
    </article>
  );
}

export function SubmissionsQueueScreen() {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(PENDING_SUBMISSIONS);
  const [showAllPending, setShowAllPending] = useState(false);

  const visiblePending = showAllPending ? pending : pending.slice(0, 2);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: parse CSV and merge into queue when backend is wired
    e.target.value = "";
  };

  const handleApprove = (id: string) => {
    setPending((list) => list.filter((p) => p.id !== id));
  };

  const handleReject = (id: string) => {
    setPending((list) => list.filter((p) => p.id !== id));
  };

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
        <div className="mx-auto flex w-full min-w-0 max-w-xl items-start justify-between gap-3 px-4 pb-4 sm:px-5">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-neutral-900">Submissions queue</h1>
            <p className="mt-1 text-sm text-neutral-600">Approve or reject restaurant submissions.</p>
          </div>
          <div className="shrink-0">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={handleCsvUpload}
            />
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
            >
              <Upload className="h-4 w-4 text-neutral-600" aria-hidden />
              Upload CSV
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-xl space-y-8 px-4 py-6 sm:px-5">
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            Pending submissions
          </h2>
          <div className="mt-3 space-y-3">
            {visiblePending.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-4 py-8 text-center text-sm text-neutral-600">
                No pending submissions right now.
              </p>
            ) : (
              visiblePending.map((item) => (
                <PendingCard
                  key={item.id}
                  item={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )}
          </div>
          {pending.length > 2 && !showAllPending ? (
            <button
              type="button"
              onClick={() => setShowAllPending(true)}
              className="mt-4 w-full rounded-2xl border border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
            >
              Show all
            </button>
          ) : null}
        </section>

        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            Flagged listings
          </h2>
          <div className="mt-3 space-y-3">
            {FLAGGED_LISTINGS.map((item) => (
              <article
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm"
              >
                <div className="h-16 w-16 shrink-0 rounded-xl bg-neutral-200/80" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-neutral-900">{item.restaurant}</p>
                  <p className="mt-0.5 text-xs text-neutral-600">{item.reason}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: ACCENT }}>
                    <Flag className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {item.flagCount} flags
                  </p>
                </div>
                <Link
                  href={routes.map}
                  className="inline-flex shrink-0 items-center justify-center rounded-full border-2 bg-orange-50/50 px-4 py-2 text-xs font-bold transition hover:bg-orange-50"
                  style={{ borderColor: ACCENT, color: ACCENT }}
                >
                  View listing
                </Link>
              </article>
            ))}
          </div>
        </section>

        <FeaturedListingsSection />
      </main>
    </div>
  );
}
