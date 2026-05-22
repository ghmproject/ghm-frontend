"use client";

import { Download, Flag, RotateCcw, ThumbsDown, ThumbsUp, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  approveSubmission,
  deleteReportedListing,
  getPendingSubmissions,
  getReportedListings,
  downloadAdminCsv,
  importAdminCsv,
  rejectSubmission,
  restoreReportedListing,
} from "@/api/routes/admin.api";
import { ApiError } from "@/api/inspector";
import { PUBLIC_PAGE_HEADER_PT } from "@/components/layout/PublicListPageShell";
import { routes } from "@/config/routes";
import type { PendingSubmission, ReportedListing } from "@/features/submissions/data/mock-submissions";
import { mapPendingMealToSubmission } from "@/features/submissions/utils/mapPendingMeal";
import { mapReportedMealToListing } from "@/features/submissions/utils/mapReportedMeal";
import { FeaturedListingsSection } from "@/features/submissions/components/FeaturedListingsSection";
import { formatPriceCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils/cn";

const ACCENT = "#FF5722";
const PAGE_BG = "#fff9f2";

function PendingCard({
  item,
  onApprove,
  onReject,
  busy,
}: {
  item: PendingSubmission;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  busy?: boolean;
}) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          className="h-16 w-16 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="h-16 w-16 shrink-0 rounded-xl bg-neutral-200/80" aria-hidden />
      )}
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
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100/80 disabled:opacity-60"
        >
          <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
          Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(item.id)}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
        >
          <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
          Reject
        </button>
      </div>
    </article>
  );
}

function ReportedCard({
  item,
  onRestore,
  onDelete,
  busy,
}: {
  item: ReportedListing;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  busy?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-xl bg-neutral-200/80" aria-hidden />
        )}
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
          <p className="mt-2 inline-flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: ACCENT }}
            >
              <Flag className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {item.flagCount} {item.flagCount === 1 ? "report" : "reports"}
            </span>
            {item.isHidden ? (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                Hidden from map
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5 rounded-xl bg-neutral-50 px-3 py-2.5">
        {item.reasons.slice(0, 4).map((reason, i) => (
          <li key={`${item.id}-reason-${i}`} className="text-xs text-neutral-700">
            <span className="font-semibold text-neutral-500">#{i + 1}</span> {reason}
          </li>
        ))}
        {item.reasons.length > 4 ? (
          <li className="text-xs font-medium text-neutral-500">
            +{item.reasons.length - 4} more report(s)
          </li>
        ) : null}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={routes.restaurant(String(item.restaurantId))}
          className="inline-flex flex-1 items-center justify-center rounded-full border-2 bg-orange-50/50 px-4 py-2 text-xs font-bold transition hover:bg-orange-50 sm:flex-none"
          style={{ borderColor: ACCENT, color: ACCENT }}
        >
          View listing
        </Link>
        <button
          type="button"
          onClick={() => onRestore(item.id)}
          disabled={busy || !item.isHidden}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100/80 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Restore
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60 sm:flex-none"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Delete
        </button>
      </div>
    </article>
  );
}

export function SubmissionsQueueScreen() {
  const queryClient = useQueryClient();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingSubmission[]>([]);
  const [reported, setReported] = useState<ReportedListing[]>([]);
  const [showAllPending, setShowAllPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingReported, setLoadingReported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvDownloading, setCsvDownloading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const visiblePending = showAllPending ? pending : pending.slice(0, 2);

  const loadPending = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await getPendingSubmissions();
      if (!res.success) {
        setPending([]);
        return;
      }
      setPending(res.data.map(mapPendingMealToSubmission));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load pending submissions.");
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReported = useCallback(async () => {
    setLoadingReported(true);
    try {
      const res = await getReportedListings();
      if (!res.success) {
        setReported([]);
        return;
      }
      const rows = res.data.map(mapReportedMealToListing);
      rows.sort((a, b) => {
        if (a.isHidden !== b.isHidden) return a.isHidden ? -1 : 1;
        return b.flagCount - a.flagCount;
      });
      setReported(rows);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load reported listings.",
      );
      setReported([]);
    } finally {
      setLoadingReported(false);
    }
  }, []);

  useEffect(() => {
    void loadPending();
    void loadReported();
  }, [loadPending, loadReported]);

  const handleCsvDownload = async () => {
    try {
      setCsvDownloading(true);
      setError(null);
      await downloadAdminCsv();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "CSV download failed.");
    } finally {
      setCsvDownloading(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (
      !lower.endsWith(".csv") &&
      !lower.endsWith(".xlsx") &&
      !lower.endsWith(".xls")
    ) {
      setCsvSuccess(null);
      setError("Upload a .csv or Excel file (.xlsx, .xls).");
      return;
    }

    void (async () => {
      setCsvUploading(true);
      setError(null);
      setCsvSuccess(null);
      try {
        const res = await importAdminCsv(file);
        setCsvSuccess(
          `${res.message} · ${res.restaurantsCreated ?? 0} restaurants, ${res.mealsCreated ?? 0} meals` +
            ((res.skippedRows ?? 0) > 0 ? `, ${res.skippedRows} skipped` : ""),
        );
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "CSV import failed.");
      } finally {
        setCsvUploading(false);
      }
    })();
  };

  const handleApprove = async (id: string) => {
    setActionId(id);
    setError(null);
    try {
      await approveSubmission(id);
      setPending((list) => list.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not approve submission.");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    setError(null);
    try {
      await rejectSubmission(id);
      setPending((list) => list.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reject submission.");
    } finally {
      setActionId(null);
    }
  };

  const handleRestoreReported = async (id: string) => {
    setActionId(id);
    setError(null);
    try {
      await restoreReportedListing(id);
      void queryClient.invalidateQueries({ queryKey: ["map-listings"] });
      setReported((list) => list.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not restore listing.");
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteReported = async (id: string) => {
    setActionId(id);
    setError(null);
    try {
      await deleteReportedListing(id);
      void queryClient.invalidateQueries({ queryKey: ["map-listings"] });
      setReported((list) => list.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete listing.");
    } finally {
      setActionId(null);
    }
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
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCsvDownload()}
              disabled={csvDownloading || csvUploading}
              title="Download CSV"
              aria-label="Download CSV"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-neutral-600 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60"
            >
              <Download className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            </button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={handleCsvUpload}
            />
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              disabled={csvUploading || csvDownloading}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60"
            >
              <Upload className="h-4 w-4 text-neutral-600" aria-hidden />
              {csvUploading ? "Importing…" : "Upload CSV / Excel"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-xl space-y-8 px-4 py-6 sm:px-5">
        {csvSuccess ? (
          <p className="text-sm font-medium text-emerald-700" role="status">
            {csvSuccess}
          </p>
        ) : null}
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            Pending submissions
          </h2>
          {error ? (
            <p className="mt-3 text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-3 space-y-3">
            {loading ? (
              <p className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-4 py-8 text-center text-sm text-neutral-600">
                Loading pending submissions…
              </p>
            ) : visiblePending.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-4 py-8 text-center text-sm text-neutral-600">
                No pending submissions right now.
              </p>
            ) : (
              visiblePending.map((item) => (
                <PendingCard
                  key={item.id}
                  item={item}
                  busy={actionId === item.id}
                  onApprove={(id) => void handleApprove(id)}
                  onReject={(id) => void handleReject(id)}
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
            Reported listings
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Meals hidden from the map (3+ reports). Restore or delete to clear from this queue.
          </p>
          <div className="mt-3 space-y-3">
            {loadingReported ? (
              <p className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-4 py-8 text-center text-sm text-neutral-600">
                Loading reported listings…
              </p>
            ) : reported.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-4 py-8 text-center text-sm text-neutral-600">
                No reported listings right now.
              </p>
            ) : (
              reported.map((item) => (
                <ReportedCard
                  key={item.id}
                  item={item}
                  busy={actionId === item.id}
                  onRestore={(id) => void handleRestoreReported(id)}
                  onDelete={(id) => void handleDeleteReported(id)}
                />
              ))
            )}
          </div>
        </section>

        <FeaturedListingsSection />
      </main>
    </div>
  );
}
