"use client";

import { Flame, MapPin, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";

const STORAGE_KEY = "ghm:onboarding";

const ACCENT = "#FF5722";

type Phase = "unknown" | "show" | "hide";
type Step = "welcome" | "location" | "guidance";

function requestGeolocation(onDone: () => void) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onDone();
    return;
  }
  navigator.geolocation.getCurrentPosition(
    () => onDone(),
    () => onDone(),
    { enableHighAccuracy: true, maximumAge: 60_000, timeout: 12_000 },
  );
}

export function AppOnboarding() {
  const [phase, setPhase] = useState<Phase>("unknown");
  const [step, setStep] = useState<Step>("welcome");

  useEffect(() => {
    try {
      setPhase(localStorage.getItem(STORAGE_KEY) === "done" ? "hide" : "show");
    } catch {
      setPhase("show");
    }
  }, []);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "done");
    } catch {
      /* ignore */
    }
    setPhase("hide");
    setStep("welcome");
  }, []);

  if (phase === "unknown" || phase === "hide") return null;

  const ui = (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-[#fff9f2]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="flex min-h-0 flex-1 flex-col px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:mx-auto sm:w-full sm:max-w-md sm:px-8">
        {step === "welcome" ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Welcome
              </p>
              <h1
                id="onboarding-title"
                className="mt-3 text-3xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-[2rem]"
              >
                {siteConfig.name}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-neutral-600">{siteConfig.tagline}</p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-500">
                Cheap eats nearby — ranked by the community. A quick tour gets you started.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep("location")}
              className="mt-8 flex h-12 w-full shrink-0 items-center justify-center rounded-2xl text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(255,87,34,0.35)] transition hover:brightness-105 active:scale-[0.99]"
              style={{ backgroundColor: ACCENT }}
            >
              Continue
            </button>
          </>
        ) : null}

        {step === "location" ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Location
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem]">
                See what&apos;s near you
              </h2>
              <p className="mt-3 text-base leading-relaxed text-neutral-600">
                We use your approximate location to show deals on the map and sort results by distance.
                You can change this anytime in your browser settings.
              </p>
            </div>
            <div className="mt-8 flex shrink-0 flex-col gap-2">
              <button
                type="button"
                onClick={() => requestGeolocation(() => setStep("guidance"))}
                className="flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(255,87,34,0.35)] transition hover:brightness-105 active:scale-[0.99]"
                style={{ backgroundColor: ACCENT }}
              >
                Allow location
              </button>
              <button
                type="button"
                onClick={() => setStep("guidance")}
                className="flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-semibold text-neutral-700 transition hover:bg-neutral-100"
              >
                Not now
              </button>
            </div>
          </>
        ) : null}

        {step === "guidance" ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Quick tips
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem]">
                Here&apos;s how to use the app
              </h2>
              <ul className="mt-6 space-y-4">
                <li className="flex gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-sm ring-1 ring-neutral-200/60">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <MapPin className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900">Map &amp; deals</p>
                    <p className="mt-0.5 text-sm leading-snug text-neutral-600">
                      Explore the map, filters, and hot deals near your area.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-sm ring-1 ring-neutral-200/60">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900">Community feed</p>
                    <p className="mt-0.5 text-sm leading-snug text-neutral-600">
                      Share finds, tips, and price checks with other cheap-eat hunters.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-sm ring-1 ring-neutral-200/60">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <Flame className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900">Save &amp; rankings</p>
                    <p className="mt-0.5 text-sm leading-snug text-neutral-600">
                      Heart places to revisit and check community rankings anytime.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={finish}
              className={cn(
                "mt-8 flex h-12 w-full shrink-0 items-center justify-center rounded-2xl text-[15px] font-semibold text-white",
                "shadow-[0_4px_14px_rgba(255,87,34,0.35)] transition hover:brightness-105 active:scale-[0.99]",
              )}
              style={{ backgroundColor: ACCENT }}
            >
              Get started
            </button>
          </>
        ) : null}

        <p className="mt-4 text-center text-[11px] text-neutral-400">
          Step {step === "welcome" ? 1 : step === "location" ? 2 : 3} of 3
        </p>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(ui, document.body);
}
