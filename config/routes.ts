export const routes = {
  /** Ranked list (Top cheap eats). */
  rankings: "/rankings",
  map: "/map",
  restaurant: (id: string) => `/restaurant/detail?id=${encodeURIComponent(id)}`,
  hotDeals: "/hot-deals",
  community: "/community",
  saved: "/saved",
  profile: "/profile",
  privacyPolicy: "/privacy",
  submissions: "/submissions",
  login: "/login",
} as const;
