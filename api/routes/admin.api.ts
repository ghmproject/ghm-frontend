import { ApiError, apiRequest } from "@/api/inspector";
import { env } from "@/config/env";
import { getBackendAccessToken } from "@/lib/auth/backendAccessToken";
import type {
  ImportCsvResponse,
  ModerationActionResponse,
  PendingMealsResponse,
  ReportedMealsResponse,
} from "@/api/types/admin";

export function getPendingSubmissions() {
  return apiRequest<PendingMealsResponse>("/api/admin/pending", {
    credentials: "include",
  });
}

export function approveSubmission(mealId: string | number) {
  return apiRequest<ModerationActionResponse>(`/api/admin/approve/${mealId}`, {
    method: "PATCH",
    credentials: "include",
  });
}

export function rejectSubmission(mealId: string | number) {
  return apiRequest<ModerationActionResponse>(`/api/admin/reject/${mealId}`, {
    method: "PATCH",
    credentials: "include",
  });
}

/** Meals with user reports and/or auto-hidden (3+ reports). */
export function getReportedListings() {
  return apiRequest<ReportedMealsResponse>("/api/admin/reported-listings", {
    credentials: "include",
  });
}

/** Clear hide flags — listing shows on map again. */
export function restoreReportedListing(mealId: string | number) {
  return apiRequest<ModerationActionResponse>(`/api/admin/restore-listing/${mealId}`, {
    method: "PATCH",
    credentials: "include",
  });
}

/** Permanently remove meal (and restaurant if empty). */
export function deleteReportedListing(mealId: string | number) {
  return rejectSubmission(mealId);
}

export async function importAdminCsv(file: File): Promise<ImportCsvResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const headers = new Headers();
  const token = getBackendAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${env.apiBaseUrl}/api/admin/import-csv`, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });

  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data as ImportCsvResponse;
}

const CSV_TEMPLATE_PATH = "/restaurants_headers_only.csv";
const CSV_TEMPLATE_FILENAME = "restaurants_headers_only.csv";

/** Download CSV import template from `public/restaurants_headers_only.csv`. */
export async function downloadAdminCsv(): Promise<void> {
  const res = await fetch(CSV_TEMPLATE_PATH, { cache: "no-store" });

  if (!res.ok) {
    throw new ApiError("Could not download CSV template.", res.status);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = CSV_TEMPLATE_FILENAME;
  anchor.click();
  URL.revokeObjectURL(url);
}
