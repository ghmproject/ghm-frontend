import type { Metadata } from "next";

import { env } from "@/config/env";
import { siteConfig } from "@/config/site";

function apiOrigin(): string | null {
  try {
    return new URL(env.apiBaseUrl).origin;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "Map",
  description: `Explore cheap eats on the ${siteConfig.name} map.`,
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  const origin = apiOrigin();

  return (
    <>
      <link rel="dns-prefetch" href="https://maps.googleapis.com" />
      <link rel="preconnect" href="https://maps.googleapis.com" />
      <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      {origin ? <link rel="preconnect" href={origin} /> : null}
      {children}
    </>
  );
}
