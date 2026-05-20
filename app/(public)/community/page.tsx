"use client";

import { useEffect, useRef, useState } from "react";
import { Ellipsis, MessageCircle, Search, ThumbsUp } from "lucide-react";

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
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [replyingToPostId, setReplyingToPostId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  const byCategory =
    activeFilter === 0
      ? FEED_POSTS
      : FEED_POSTS.filter((post) => {
          if (activeFilter === 1) return post.category === "finds";
          if (activeFilter === 2) return post.category === "tips";
          return post.category === "price-checks";
        });

  const q = searchQuery.trim().toLowerCase();
  const filtered =
    q.length === 0
      ? byCategory
      : byCategory.filter((post) => {
          const haystack = `${post.title} ${post.body} ${post.author}`.toLowerCase();
          return haystack.includes(q);
        });

  useEffect(() => {
    if (!searchOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (searchWrapRef.current?.contains(target)) return;
      setSearchOpen(false);
      setSearchQuery("");
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [searchOpen]);

  useEffect(() => {
    if (!replyingToPostId) return;
    // Focus after render
    const t = window.setTimeout(() => replyInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [replyingToPostId]);

  return (
    <PublicListPageShell
      title="Feed"
      subtitle="Finds, tips & brags"
      headerAction={
        <FeedCommentPenButton
          onClick={() => {
            setEditingPostId(null);
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
        {searchOpen ? (
          <div ref={searchWrapRef} className="flex min-w-[220px] shrink-0 items-center">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="h-10 w-full rounded-full border border-neutral-200/90 bg-white px-4 text-sm text-neutral-800 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:ring-2 focus:ring-[#FF5722]/25"
              aria-label="Search feed"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchOpen(false);
                  setSearchQuery("");
                }
              }}
            />
          </div>
        ) : null}
        {!searchOpen ? (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-neutral-600 shadow-sm transition hover:bg-neutral-50"
            aria-label="Search feed"
          >
            <Search className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
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
                  <div className="mt-1.5 flex items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-neutral-900 sm:text-base">
                      {post.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPostId(post.id);
                        setComposerOpen(true);
                      }}
                      className="mt-[-2px] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
                      aria-label={`Edit · ${post.title}`}
                      title="Edit"
                    >
                      <Ellipsis className="h-5 w-5" aria-hidden />
                    </button>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{post.body}</p>
                  <div className="mt-3 flex items-center gap-4 text-neutral-500">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      <ThumbsUp className="h-4 w-4" aria-hidden />
                      {post.likes}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingToPostId(post.id);
                        setReplyDraft("");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium transition hover:text-neutral-700"
                      aria-label={`Reply · ${post.comments} comments`}
                    >
                      <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
                      {post.comments}
                    </button>
                  </div>

                  {replyingToPostId === post.id ? (
                    <div className="mt-3 rounded-2xl bg-orange-50/60 p-3">
                      <label htmlFor={`feed-reply-${post.id}`} className="sr-only">
                        Write a reply
                      </label>
                      <textarea
                        id={`feed-reply-${post.id}`}
                        ref={replyInputRef}
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        placeholder="Write a reply…"
                        rows={2}
                        className="w-full resize-none rounded-2xl border-0 bg-white/90 px-3.5 py-3 text-sm text-neutral-900 outline-none ring-0 transition placeholder:text-neutral-400 focus:ring-2 focus:ring-[#FF5722]/25"
                      />
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToPostId(null);
                            setReplyDraft("");
                          }}
                          className="h-9 rounded-full px-3 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-200/60"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!replyDraft.trim()}
                          onClick={() => {
                            const text = replyDraft.trim();
                            if (!text) return;
                            console.info("Feed reply:", { replyingTo: post.id, reply: text });
                            setReplyingToPostId(null);
                            setReplyDraft("");
                          }}
                          className="h-9 rounded-full px-4 text-xs font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-50"
                          style={{ backgroundColor: PUBLIC_PAGE_ACCENT }}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <FeedCommentModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        mode="feed"
        defaultTitle={
          (editingPostId ? FEED_POSTS.find((p) => p.id === editingPostId)?.title : "") ?? ""
        }
        defaultCategory={
          editingPostId
            ? FEED_POSTS.find((p) => p.id === editingPostId)?.category
            : undefined
        }
        defaultDetailsHtml={
          editingPostId ? FEED_POSTS.find((p) => p.id === editingPostId)?.body ?? "" : ""
        }
      />
    </PublicListPageShell>
  );
}