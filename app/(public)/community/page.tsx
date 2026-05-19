"use client";

import { useState } from "react";
import { MessageCircle, Search, ThumbsUp } from "lucide-react";

import { FeedCommentPenButton } from "@/components/layout/FeedCommentPenButton";
import { FeedCommentModal } from "@/features/community/components/FeedCommentModal";
import {
  PUBLIC_PAGE_ACCENT,
  PublicListPageShell,
} from "@/components/layout/PublicListPageShell";
import { cn } from "@/lib/utils/cn";

const FILTER_LABELS = ["All", "Finds", "Tips", "Price checks"] as const;

const FEED_POSTS = [
  {
    id: "1",
    author: "Peter",
    initial: "P",
    ago: "1h",
    title: "Found $6 pho in the Valley!",
    body: "Pho Thanh Long has a lunch bowl for $6 if you order before 11:30. Cash only at the counter.",
    likes: 24,
    comments: 8,
    category: "finds" as const,
  },
  {
    id: "2",
    author: "Sarah",
    initial: "S",
    ago: "2h",
    title: "Best $7.50 Banh Mi in West End",
    body: "Hello Banh Mi on Vulture St — crispy roll, extra pâté if you ask nicely. Worth the walk.",
    likes: 41,
    comments: 12,
    category: "finds" as const,
  },
  {
    id: "3",
    author: "Ben",
    initial: "B",
    ago: "5h",
    title: "Tip: Sushi train off-peak pricing",
    body: "Sushi d'Lite drops plates to $2.50 after 2pm on weekdays. Go hungry, leave happy.",
    likes: 18,
    comments: 3,
    category: "tips" as const,
  },
  {
    id: "4",
    author: "Aisha",
    initial: "A",
    ago: "3d",
    title: "Price check: Momo House still $7?",
    body: "Confirmed yesterday — 8pc steamed momos are still $7. Portion hasn't shrunk either.",
    likes: 56,
    comments: 15,
    category: "price-checks" as const,
  },
] as const;

export default function CommunityPage() {
  const [activeFilter, setActiveFilter] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<"feed" | "comment">("comment");
  const [commentTargetTitle, setCommentTargetTitle] = useState("");

  const filtered =
    activeFilter === 0
      ? FEED_POSTS
      : FEED_POSTS.filter((post) => {
          if (activeFilter === 1) return post.category === "finds";
          if (activeFilter === 2) return post.category === "tips";
          return post.category === "price-checks";
        });

  return (
    <PublicListPageShell
      title="Feed"
      subtitle="Finds, tips & brags"
      headerAction={
        <FeedCommentPenButton
          onClick={() => {
            setCommentTargetTitle("");
            setComposerMode("feed");
            setComposerOpen(true);
          }}
        />
      }
    >
      <div
        className={cn(
          "mb-5 flex w-full min-w-0 items-center gap-2",
          "max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:overscroll-x-contain max-sm:pb-1",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {FILTER_LABELS.map((label, i) => {
          const active = i === activeFilter;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setActiveFilter(i)}
              aria-pressed={active}
              className={cn(
                "shrink-0 cursor-pointer rounded-full px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5722]/35",
                active
                  ? "text-white shadow-md shadow-orange-500/20"
                  : "border border-neutral-200/90 bg-white text-neutral-700 shadow-sm hover:border-neutral-300 hover:bg-neutral-50/80",
              )}
              style={active ? { backgroundColor: PUBLIC_PAGE_ACCENT } : undefined}
            >
              {label}
            </button>
          );
        })}
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-neutral-600 shadow-sm transition hover:bg-neutral-50"
          aria-label="Search feed"
        >
          <Search className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <ul className="w-full">
        {filtered.map((post) => (
          <li
            key={post.id}
            className="border-neutral-300/40 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-dotted"
          >
            <article className="py-4 sm:py-[1.125rem]">
              <div className="flex gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: PUBLIC_PAGE_ACCENT }}
                  aria-hidden
                >
                  {post.initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-neutral-500">
                    <span className="font-semibold text-neutral-800">{post.author}</span>
                    <span aria-hidden> · </span>
                    <span>{post.ago}</span>
                  </p>
                  <h3 className="mt-1.5 text-[15px] font-bold leading-snug text-neutral-900 sm:text-base">
                    {post.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{post.body}</p>
                  <div className="mt-3 flex items-center gap-4 text-neutral-500">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      <ThumbsUp className="h-4 w-4" aria-hidden />
                      {post.likes}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCommentTargetTitle(post.title);
                        setComposerMode("comment");
                        setComposerOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium transition hover:text-neutral-700"
                      aria-label={`Reply · ${post.comments} comments`}
                    >
                      <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
                      {post.comments}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <FeedCommentModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        mode={composerMode}
        defaultTitle={composerMode === "comment" ? commentTargetTitle : ""}
      />
    </PublicListPageShell>
  );
}