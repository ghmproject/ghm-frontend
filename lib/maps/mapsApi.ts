/** Single Vercel serverless function for all map proxy APIs. */
export const MAPS_API_PATH = "/api/maps";

export type MapsApiAction =
  | "geocode"
  | "reverse-geocode"
  | "driving-route"
  | "driving-distances";
