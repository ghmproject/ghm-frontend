/// <reference types="google.maps" />

/**
 * Light grayscale map styling so price markers stay readable.
 * @see https://developers.google.com/maps/documentation/javascript/styling
 */
export const SILVER_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

/** Greater Brisbane — map centre, geocode box, and “near service area” checks. */
export const DEFAULT_MAP_CENTER: google.maps.LatLngLiteral = {
  lat: -27.470027,
  lng: 153.022977,
};

export const DEFAULT_MAP_ZOOM = 14;

/** User pinch/zoom limits (Google Maps + Leaflet container). */
export const MAP_MIN_ZOOM = 11;
/** CARTO Positron PNG tiles — safe max (beyond this tiles go blank). */
export const MAP_TILE_MAX_ZOOM = 19;
/** Must match tile max — do not allow overscale or the map turns grey. */
export const MAP_MAX_ZOOM = MAP_TILE_MAX_ZOOM;

/** Greater Brisbane / SEQ — panning restricted to this box. */
export const BRISBANE_BOUNDS: google.maps.LatLngBoundsLiteral = {
  south: -27.95,
  west: 152.48,
  north: -26.98,
  east: 153.62,
};

/** Leaflet `maxBounds`: south-west then north-east, [lat, lng]. */
export const BRISBANE_MAX_BOUNDS: [[number, number], [number, number]] = [
  [BRISBANE_BOUNDS.south, BRISBANE_BOUNDS.west],
  [BRISBANE_BOUNDS.north, BRISBANE_BOUNDS.east],
];
