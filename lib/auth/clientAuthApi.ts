import { sendMagicLink } from "@/api/routes/auth.api";
import { roleFromBackend } from "@/lib/auth/backendRole";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/accessTokenCookie.constants";
import {
  clearPendingEmail,
  clearStoredSession,
  getPendingEmail,
  getStoredSession,
  setPendingEmail,
  setStoredSession,
} from "@/lib/auth/clientSessionStorage";
import { defaultNicknameForEmail } from "@/lib/auth/nickname";
import type { AuthSession } from "@/lib/auth/types";

const ACCESS_TOKEN_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function setAccessTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; Max-Age=${ACCESS_TOKEN_MAX_AGE_SEC}; path=/; SameSite=Lax${secure}`;
}

export async function fetchClientSession(): Promise<AuthSession | null> {
  return getStoredSession();
}

export async function fetchAuthBootstrap(): Promise<{
  session: AuthSession | null;
  pendingSync: boolean;
}> {
  const session = getStoredSession();
  const pendingEmail = getPendingEmail();
  return {
    session,
    pendingSync: !session && Boolean(pendingEmail),
  };
}

export async function clearClientSession(): Promise<void> {
  clearStoredSession();
  clearPendingEmail();
  if (typeof document !== "undefined") {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    document.cookie = `${ACCESS_TOKEN_COOKIE}=; Max-Age=0; path=/; SameSite=Lax${secure}`;
  }
}

export async function signInWithEmailClient(email: string): Promise<{
  error?: string;
  success?: string;
}> {
  const normalized = email.trim().toLowerCase();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!normalized || !emailRe.test(normalized)) {
    return { error: "Enter a valid email address." };
  }

  try {
    await sendMagicLink(normalized);
    setPendingEmail(normalized);
    return {
      success: "Check your email and click the sign-in link. You will be taken to the map.",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not send the magic link. Try again.";
    return { error: message };
  }
}

export async function establishSessionAfterVerifyClient(
  role: string,
  accessToken?: string | null,
): Promise<{ ok: true } | { ok: false; reason: "missing-email" }> {
  const email = getPendingEmail();
  if (!email) {
    return { ok: false, reason: "missing-email" };
  }

  const backendRole = roleFromBackend(role);
  setStoredSession({
    email,
    role: backendRole,
    nickname: defaultNicknameForEmail(email, backendRole),
  });

  if (accessToken?.trim()) {
    setAccessTokenCookie(accessToken.trim());
  }

  clearPendingEmail();
  return { ok: true };
}

export async function syncSessionFromBackendClient(
  backendRole: string,
): Promise<boolean> {
  if (getStoredSession()) return false;

  const email = getPendingEmail();
  if (!email) return false;

  const role = roleFromBackend(backendRole);
  setStoredSession({
    email,
    role,
    nickname: defaultNicknameForEmail(email, role),
  });
  clearPendingEmail();
  return true;
}

export async function syncProfileNicknameClient(
  nickname: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = getStoredSession();
  if (!session) {
    return { error: "Sign in to update your profile." };
  }

  const name = nickname.trim();
  if (!name) {
    return { error: "Nickname cannot be empty." };
  }
  if (name.length > 32) {
    return { error: "Nickname must be 32 characters or less." };
  }

  setStoredSession({ ...session, nickname: name });
  return { success: true };
}
