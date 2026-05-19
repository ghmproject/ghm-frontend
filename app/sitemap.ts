import type { MetadataRoute } from "next";

import { routes } from "@/config/routes";
import { MOCK_RESTAURANTS } from "@/features/restaurants/data/mock-restaurants";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    routes.map,
    routes.rankings,
    routes.hotDeals,
    routes.community,
    routes.saved,
    routes.login,
  ];

  return [
    ...staticRoutes.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: path === routes.map ? 1 : 0.8,
    })),
    ...MOCK_RESTAURANTS.map((r) => ({
      url: `${siteUrl}${routes.restaurant(r.id)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
