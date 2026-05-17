import { NEARBY_LISTINGS_RADIUS_KM } from "@/constants/limits";
import type { LatLng } from "@/features/restaurants/types/restaurant";
import { isNearBrisbane } from "@/features/maps/utils/nearBrisbane";

/**
 * DB restaurant example: 27°24'34.4"S 153°03'50.1"E
 * → West End / South Brisbane, Queensland, Australia (not Pakistan).
 */
export const BRISBANE_LISTINGS_HUB: LatLng = {
  lat: -27.470030,
  lng: 153.022980,
};

export const nearbySearchConfig = {
  /** Search radius around the listings hub (greater Brisbane metro). */
  radiusKm: NEARBY_LISTINGS_RADIUS_KM,
  listingsHub: BRISBANE_LISTINGS_HUB,
} as const;

/**
 * Where to query /api/listingNearby/nearby.
 * - In Brisbane: use live GPS (true “near me”).
 * - Overseas (e.g. Pakistan): use Brisbane hub so DB pins still load.
 */
export function resolveNearbySearchCenter(
  coords: LatLng | null,
  locationReady: boolean,
): LatLng {
  if (locationReady && coords && isNearBrisbane(coords)) {
    return coords;
  }
  return nearbySearchConfig.listingsHub;
}

export function listingsHubLabel(): string {
  return "West End, Brisbane QLD";
}
