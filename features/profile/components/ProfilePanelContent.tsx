"use client";

import { ChevronRight, ClipboardList, LogOut, Mail, Shield, User, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { updateProfileName } from "@/api/routes/profile.api";
import { ApiError } from "@/api/inspector";
import { syncProfileNicknameClient } from "@/lib/auth/clientAuthApi";
import { useSignOut } from "@/features/auth/hooks/useSignOut";
import { routes } from "@/config/routes";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const ACCENT = "#FF5722";
type ProfilePanelContentProps = {
  variant?: "page" | "sidebar";
  onClose?: () => void;
};

function ProfileAvatar({ size = "md" }: { size?: "md" | "sm" }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#FF5722] ring-1 ring-orange-200/70",
        size === "md" ? "h-12 w-12" : "h-10 w-10",
      )}
      aria-hidden
    >
      <User className={size === "md" ? "h-6 w-6" : "h-5 w-5"} strokeWidth={1.75} />
    </div>
  );
}

function ActiveBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-[#e64a19] ring-1 ring-orange-200/80">
      <span className="h-1.5 w-1.5 rounded-full bg-[#FF5722]" aria-hidden />
      Active
    </span>
  );
}

export function ProfilePanelContent({
  variant = "page",
  onClose,
}: ProfilePanelContentProps) {
  const { session, isAdmin, isHydrating, refreshSession } = useAuth();
  const { signOut, pending: signOutPending } = useSignOut();
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const isSidebar = variant === "sidebar";

  useEffect(() => {
    if (session) {
      setNicknameDraft(session.nickname);
    }
  }, [session]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setPending(true);
    try {
      await updateProfileName(nicknameDraft.trim());
      const result = await syncProfileNicknameClient(nicknameDraft);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      await refreshSession();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save profile.");
    } finally {
      setPending(false);
    }
  }

  if (isHydrating) {
    return (
      <div className="w-full max-w-md animate-pulse space-y-4 px-1 py-2" aria-busy="true">
        <div className="h-12 w-12 rounded-full bg-neutral-200" />
        <div className="h-4 w-40 rounded bg-neutral-200" />
        <div className="h-10 w-full rounded-xl bg-neutral-200" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isDirty = nicknameDraft.trim() !== session.nickname;

  const mainContent = (
    <>
      {isSidebar && onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-[2] flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200/90 hover:text-neutral-700"
          aria-label="Close profile"
        >
          <X className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}

      <div className={cn("flex items-start gap-3", isSidebar && "pr-8")}>
        <ProfileAvatar size="md" />
        <div className="min-w-0 pt-0.5">
          <h2
            className={cn(
              "font-bold tracking-tight text-[#1e293b]",
              isSidebar ? "text-xl" : "text-2xl",
            )}
          >
            Profile
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">Manage your account settings</p>
        </div>
      </div>

      {isAdmin ? (
        <Link
          href={routes.submissions}
          onClick={onClose}
          className="mt-5 flex items-center gap-3 rounded-xl border border-orange-200/80 bg-orange-50/60 p-3 transition hover:bg-orange-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#FF5722] ring-1 ring-orange-200/80">
            <ClipboardList className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-neutral-900">Submissions queue</span>
            <span className="mt-0.5 block text-xs text-neutral-600">Approve or reject pending deals</span>
          </span>
        </Link>
      ) : null}

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/40 p-3">
        <ProfileAvatar size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#1e293b]">{session.nickname}</p>
          <p className="mt-0.5 truncate text-xs text-neutral-500">{session.email}</p>
        </div>
        <ActiveBadge />
      </div>

      <form onSubmit={(e) => void handleSave(e)} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="profile-nickname"
            className="flex items-center gap-2 text-sm font-medium text-neutral-600"
          >
            <User className="h-4 w-4 text-neutral-400" strokeWidth={2} aria-hidden />
            Nickname
          </label>
          <input
            id="profile-nickname"
            name="nickname"
            type="text"
            value={nicknameDraft}
            onChange={(e) => setNicknameDraft(e.target.value)}
            maxLength={32}
            autoComplete="nickname"
            className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 outline-none transition focus:border-[#FF5722]/40 focus:ring-2 focus:ring-[#FF5722]/15"
          />
        </div>

        <div>
          <label
            htmlFor="profile-email"
            className="flex items-center gap-2 text-sm font-medium text-neutral-600"
          >
            <Mail className="h-4 w-4 text-neutral-400" strokeWidth={2} aria-hidden />
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            readOnly
            value={session.email}
            className="mt-2 h-11 w-full cursor-default rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-700 outline-none"
          />
        </div>

        <Link
          href={routes.privacyPolicy}
          onClick={onClose}
          className="flex items-center gap-3 border-b border-neutral-200/80 py-3.5 transition hover:bg-neutral-50/60"
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700"
            aria-hidden
          >
            <Shield className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1 text-sm font-bold text-neutral-900">privacy policy</span>
          <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" strokeWidth={2} aria-hidden />
        </Link>

        {error ? (
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-sm font-medium text-[#e64a19]" role="status">
            Changes saved.
          </p>
        ) : null}

        {isDirty ? (
          <Button
            type="submit"
            className="h-11 w-full rounded-xl text-sm font-semibold shadow-sm"
            style={{ backgroundColor: ACCENT }}
            disabled={pending || !nicknameDraft.trim()}
          >
            {pending ? "Saving…" : "Save changes"}
          </Button>
        ) : null}
      </form>
    </>
  );

  const logoutButton = (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => void signOut()}
        disabled={signOutPending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-sm font-semibold text-red-600 transition hover:bg-red-50/50 disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
        {signOutPending ? "Signing out…" : "Log out"}
      </button>
    </div>
  );

  if (isSidebar) {
    return (
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-[0_8px_40px_rgba(15,23,42,0.12)]">
        <div className="ghm-scrollbar-hidden relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-3 pt-5">
          {mainContent}
        </div>
        <div className="shrink-0 px-5 pb-5 pt-2">{logoutButton}</div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center px-4 py-6">
      <div className="relative flex w-full max-w-md flex-col rounded-[1.5rem] bg-white shadow-[0_8px_40px_rgba(15,23,42,0.12)]">
        <div className="p-6 pb-4">{mainContent}</div>
        <div className="px-6 pb-6 pt-2">{logoutButton}</div>
      </div>
    </div>
  );
}
