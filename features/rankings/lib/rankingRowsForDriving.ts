import type { RankedRestaurantRow } from "@/api/types/ranking";
import type { Restaurant } from "@/features/restaurants/types/restaurant";

/** Minimal map pins for `/api/driving-distances` (same batch API as the map). */
export function rankingRowsToDrivingRestaurants(rows: RankedRestaurantRow[]): Restaurant[] {
  const out: Restaurant[] = [];

  for (const row of rows) {
    const lat = row.latitude;
    const lng = row.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    out.push({
      id: String(row.restaurantId),
      restaurantId: String(row.restaurantId),
      name: row.restaurantName,
      dish: row.dishName ?? "Meal",
      price: row.price ?? 0,
      suburb: row.suburb,
      address: row.address ?? row.suburb,
      position: { lat, lng },
      netScore: row.votes.netScore,
      worthIt: row.votes.upvotes,
      overrated: row.votes.downvotes,
    });
  }

  return out;
}
