import type { AuthSession } from "@/lib/auth/types";

const AUTH_API = "/api/auth";

export async function fetchClientSession(): Promise<AuthSession | null> {
  const res = await fetch(AUTH_API, { credentials: "include", cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as AuthSession | null;
  if (json && typeof json.email === "string") return json;
  return null;
}

export async function fetchAuthBootstrap(): Promise<{
  session: AuthSession | null;
  pendingSync: boolean;
}> {
  const res = await fetch(`${AUTH_API}?bootstrap=1`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    return { session: null, pendingSync: false };
  }
  return (await res.json()) as { session: AuthSession | null; pendingSync: boolean };
}

export async function clearClientSession(): Promise<void> {
  await fetch(AUTH_API, { method: "DELETE", credentials: "include" });
}

export async function signInWithEmailClient(email: string): Promise<{
  error?: string;
  success?: string;
}> {
  const res = await fetch(AUTH_API, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "sign-in", email }),
  });
  const json = (await res.json()) as { error?: string; success?: string };
  if (!res.ok) return { error: json.error ?? "Could not send the magic link. Try again." };
  return json;
}

export async function establishSessionAfterVerifyClient(
  role: string,
  accessToken?: string | null,
): Promise<{ ok: true } | { ok: false; reason: "missing-email" }> {
  const res = await fetch(AUTH_API, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "establish", role, accessToken }),
  });
  const json = (await res.json()) as { ok?: boolean; reason?: string };
  if (res.ok && json.ok) return { ok: true };
  return { ok: false, reason: "missing-email" };
}

export async function syncSessionFromBackendClient(
  backendRole: string,
): Promise<boolean> {
  const res = await fetch(AUTH_API, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "sync-backend", backendRole }),
  });
  if (!res.ok) return false;
  const json = (await res.json()) as { synced?: boolean };
  return Boolean(json.synced);
}

export async function syncProfileNicknameClient(
  nickname: string,
): Promise<{ error?: string; success?: boolean }> {
  const res = await fetch(AUTH_API, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "nickname", nickname }),
  });
  return (await res.json()) as { error?: string; success?: boolean };
}
