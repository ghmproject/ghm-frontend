"use client";

import { X } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import { PUBLIC_PAGE_ACCENT } from "@/components/layout/PublicListPageShell";
import { cn } from "@/lib/utils/cn";

export type FeedReplySheetPost = {
  author: string;
  ago: string;
  title: string;
  body: string;
};

export type FeedReplySheetProps = {
  open: boolean;
  onClose: () => void;
  post: FeedReplySheetPost | null;
};

export function FeedReplySheet({ open, onClose, post }: FeedReplySheetProps) {
  const titleId = useId();
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (open) setDraft("");
  }, [open]);

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

  if (!open || !post) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    console.info("Feed reply:", { replyingTo: post.title, reply: text });
    onClose();
  };

  const ui = (
    <>
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        className="fixed inset-0 z-[9998] bg-neutral-950/40"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[9999] flex max-h-[min(88dvh,36rem)] w-full flex-col bg-white",
          "rounded-t-3xl border-t border-neutral-200/80 shadow-[0_-10px_44px_rgba(0,0,0,0.14)]",
          "pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2",
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-neutral-200" aria-hidden />

        <div className="flex items-start justify-end px-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <span id={titleId} className="sr-only">
            Reply to {post.author}
          </span>

          <div className="rounded-2xl bg-orange-50/60 px-3.5 py-3">
            <p className="text-sm text-neutral-500">
              <span className="font-semibold text-neutral-800">{post.author}</span>
              <span aria-hidden> · </span>
              <span>{post.ago}</span>
            </p>
            <p className="mt-1.5 text-[15px] font-bold leading-snug text-neutral-900">{post.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">{post.body}</p>
          </div>

          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 pb-3">
            <label htmlFor="feed-reply-input" className="sr-only">
              Your reply
            </label>
            <textarea
              id="feed-reply-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a reply…"
              rows={3}
              className="w-full resize-none rounded-2xl border-0 bg-orange-50/70 px-4 py-3 text-sm text-neutral-900 outline-none ring-0 transition placeholder:text-neutral-400 focus:bg-orange-50 focus:ring-2 focus:ring-[#FF5722]/25"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="flex h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,87,34,0.35)] transition hover:brightness-105 disabled:opacity-50"
              style={{ backgroundColor: PUBLIC_PAGE_ACCENT }}
            >
              Reply
            </button>
          </form>
        </div>
      </div>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(ui, document.body);
}
