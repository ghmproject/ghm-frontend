"use client";

import { PenLine } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type FeedCommentPenButtonProps = {
  onClick: () => void;
  className?: string;
};

export function FeedCommentPenButton({ onClick, className }: FeedCommentPenButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200/90 bg-white shadow-sm transition hover:bg-neutral-50",
        className,
      )}
      aria-label="Add feed"
    >
      <PenLine className="h-5 w-5 text-neutral-700" />
    </button>
  );
}
