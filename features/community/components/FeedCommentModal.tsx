"use client";

import { X } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import {
  FEED_CATEGORIES,
  type FeedCategoryId,
} from "@/features/community/constants/feedCategories";
import { cn } from "@/lib/utils/cn";

const ACCENT = "#FF5722";

const fieldClass =
  "w-full rounded-2xl border-0 bg-orange-50/70 px-4 py-3 text-sm text-neutral-900 outline-none ring-0 transition placeholder:text-neutral-400 focus:bg-orange-50 focus:ring-2 focus:ring-[#FF5722]/25";

const labelClass =
  "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500";

export type FeedComposerMode = "feed" | "comment";

export type FeedCommentModalProps = {
  open: boolean;
  onClose: () => void;
  mode: FeedComposerMode;
  defaultTitle?: string;
  defaultCategory?: FeedCategoryId;
};

export function FeedCommentModal({
  open,
  onClose,
  mode,
  defaultTitle = "",
  defaultCategory,
}: FeedCommentModalProps) {
  const titleId = useId();
  const isFeed = mode === "feed";
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<FeedCategoryId>("finds");
  const [comment, setComment] = useState("");

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
      setTitle("");
      setCategory("finds");
      setComment("");
      return;
    }
    if (isFeed) {
      setTitle(defaultTitle);
      setCategory(defaultCategory ?? "finds");
    }
  }, [open, defaultTitle, defaultCategory, isFeed]);

  if (!open) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.info(
      isFeed ? "Feed post:" : "Feed comment:",
      isFeed
        ? { title: title.trim(), category, comment: comment.trim() }
        : { title: defaultTitle.trim(), comment: comment.trim() },
    );
    onClose();
  };

  const heading = isFeed ? "Add feed" : "Add comment";
  const submitLabel = isFeed ? "Post feed" : "Post comment";

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
          "max-sm:inset-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-full max-sm:rounded-none",
          "sm:left-1/2 sm:top-[calc(50%+0.75rem)] sm:h-auto sm:max-h-[min(92dvh,44rem)] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:border-neutral-200/80 sm:shadow-[0_8px_40px_rgba(0,0,0,0.12)]",
        )}
      >
        <header className="shrink-0 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pb-4 sm:pt-6">
          <div className="flex flex-col gap-4">
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
            <h2 id={titleId} className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.65rem]">
              {heading}
            </h2>
          </div>
        </header>

        <form
          onSubmit={onSubmit}
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6",
          )}
        >
          <div className="mb-4">
            <label htmlFor="feed-composer-title" className={labelClass}>
              Title
            </label>
            {isFeed ? (
              <input
                id="feed-composer-title"
                type="text"
                required
                placeholder="e.g. Found $6 pho in the Valley!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={fieldClass}
              />
            ) : (
              <input
                id="feed-composer-title"
                type="text"
                readOnly
                value={defaultTitle}
                className={cn(fieldClass, "cursor-default text-neutral-700")}
                tabIndex={-1}
                aria-readonly
              />
            )}
          </div>

          {isFeed ? (
          <div className="mb-4">
            <label htmlFor="feed-composer-category" className={labelClass}>
              Category
            </label>
            <select
              id="feed-composer-category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedCategoryId)}
              className={cn(fieldClass, "cursor-pointer appearance-none")}
            >
              {FEED_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          ) : null}

          <div className="mb-5">
            <label htmlFor="feed-composer-body" className={labelClass}>
              Comment
            </label>
            <textarea
              id="feed-composer-body"
              rows={4}
              required
              placeholder="Share your take…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={cn(fieldClass, "resize-none")}
            />
          </div>

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(255,87,34,0.35)] transition hover:brightness-105 active:scale-[0.99] sm:h-11 sm:text-sm"
            style={{ backgroundColor: ACCENT }}
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(ui, document.body);
}
