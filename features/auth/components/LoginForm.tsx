"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { signInWithEmailClient } from "@/lib/auth/clientAuthApi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function LoginForm() {
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const errorMessage =
    error ??
    (linkError === "missing-email"
      ? "Open the sign-in link from the same browser where you requested it, or request a new link."
      : linkError === "verify-failed"
        ? "That sign-in link is invalid or expired. Request a new one."
        : undefined);

  if (success) {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-5">
        <p className="text-sm font-medium text-neutral-900">Check your email</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{success}</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setPending(true);
    try {
      const result = await signInWithEmailClient(email);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.success) {
        setSuccess(result.success);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <label htmlFor="email" className="sr-only">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className={cn(
          "h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none",
          "placeholder:text-neutral-400 focus:border-[#FF5722]/50 focus:ring-2 focus:ring-[#FF5722]/20",
        )}
      />
      {errorMessage ? (
        <p className="mt-2 text-sm font-medium text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <Button type="submit" className="mt-4 w-full rounded-2xl" disabled={pending}>
        {pending ? "Sending link…" : "Continue with email"}
      </Button>
      <p className="mt-4 text-center text-xs leading-relaxed text-neutral-500">
        We&apos;ll email you a one-time sign-in link. No password needed.
      </p>
    </form>
  );
}
