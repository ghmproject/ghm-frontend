export type FeaturedListingStatus = "active" | "scheduled" | "inactive";

export type FeaturedListing = {
  id: string;
  restaurantId: string;
  name: string;
  dish: string;
  location: string;
  featuredUntil: string | null;
  status: FeaturedListingStatus;
  enabled: boolean;
  imageUrl?: string | null;
};

export const FEATURED_LISTINGS: FeaturedListing[] = [
  {
    id: "feat-1",
    restaurantId: "momo-house",
    name: "Momo House",
    dish: "8pc steamed momos",
    location: "South Bank",
    featuredUntil: "24 May 2025",
    status: "active",
    enabled: true,
  },
  {
    id: "feat-2",
    restaurantId: "sushi-dlite",
    name: "Sushi d'Lite",
    dish: "10pc salmon nigiri box",
    location: "South Bank",
    featuredUntil: null,
    status: "inactive",
    enabled: false,
  },
  {
    id: "feat-3",
    restaurantId: "hello-banh-mi",
    name: "Hello Banh Mi",
    dish: "Pork roll",
    location: "West End",
    featuredUntil: "1 Jun 2025",
    status: "scheduled",
    enabled: true,
  },
];
