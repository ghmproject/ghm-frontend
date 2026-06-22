import { env } from "@/config/env";

/** Map proxy API on the Express backend (keeps Vercel serverless count at zero). */
export function getMapsApiUrl(): string {
  return `${env.apiBaseUrl.replace(/\/$/, "")}/api/maps`;
}

export type MapsApiAction =
  | "geocode"
  | "reverse-geocode"
  | "driving-route"
  | "driving-distances";
