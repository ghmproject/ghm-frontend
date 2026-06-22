import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Restaurant",
};

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-[50dvh]" aria-hidden />}>{children}</Suspense>;
}
