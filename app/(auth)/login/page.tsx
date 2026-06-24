import Link from "next/link";
import { Suspense } from "react";

import { RedirectIfSignedIn } from "@/components/auth/RedirectIfSignedIn";
import { siteConfig } from "@/config/site";
import { routes } from "@/config/routes";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full min-w-0 max-w-lg flex-col px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <Link
        href={routes.map}
        className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-neutral-600 transition hover:text-neutral-900"
      >
        ← Back
      </Link>

      <div className="flex flex-1 flex-col justify-center">
        <div
          className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm"
          style={{ backgroundColor: "#FF5722" }}
        >
          G
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Sign in</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Continue with your email to use {siteConfig.name}.
        </p>

        <div className="mt-8">
          <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-neutral-100" />}>
            <RedirectIfSignedIn>
              <LoginForm />
            </RedirectIfSignedIn>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
