export const FEED_CATEGORIES = [
  { id: "finds", label: "Finds" },
  { id: "tips", label: "Tips" },
  { id: "price-checks", label: "Price checks" },
] as const;

export type FeedCategoryId = (typeof FEED_CATEGORIES)[number]["id"];
