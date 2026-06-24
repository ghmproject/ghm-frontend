import type { AuthSession } from "@/lib/auth/types";

const SESSION_KEY = "ghm_session";
const PENDING_EMAIL_KEY = "ghm_pending_email";
const PENDING_EMAIL_MAX_AGE_MS = 15 * 60 * 1000;

type PendingEmailRecord = {
  email: string;
  expiresAt: number;
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredSession(): AuthSession | null {
  const session = readJson<AuthSession>(SESSION_KEY);
  if (!session || typeof session.email !== "string") return null;
  return session;
}

export function setStoredSession(session: AuthSession): void {
  writeJson(SESSION_KEY, session);
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function getPendingEmail(): string | null {
  const record = readJson<PendingEmailRecord>(PENDING_EMAIL_KEY);
  if (!record?.email || !record.expiresAt) return null;
  if (Date.now() > record.expiresAt) {
    clearPendingEmail();
    return null;
  }
  return record.email.trim().toLowerCase();
}

export function setPendingEmail(email: string): void {
  writeJson(PENDING_EMAIL_KEY, {
    email: email.trim().toLowerCase(),
    expiresAt: Date.now() + PENDING_EMAIL_MAX_AGE_MS,
  } satisfies PendingEmailRecord);
}

export function clearPendingEmail(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_EMAIL_KEY);
}
