import { MAP_TILE_MAX_ZOOM } from "@/lib/maps/googleMaps";

/**
 * Carto Positron (light). No `{r}` — @2x retina tiles often 404 at high zoom and show a grey map.
 * @see https://github.com/CartoDB/basemap-styles
 */
export const CARTO_LIGHT_TILES = {
  url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  subdomains: "abcd",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: MAP_TILE_MAX_ZOOM,
  maxNativeZoom: MAP_TILE_MAX_ZOOM,
} as const;
