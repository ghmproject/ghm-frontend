"use server";

import { redirect } from "next/navigation";

import { sendMagicLink as sendMagicLinkApi } from "@/api/routes/auth.api";
import { routes } from "@/config/routes";
import { roleFromBackend } from "@/lib/auth/backendRole";
import { defaultNicknameForEmail } from "@/lib/auth/nickname";
import {
  clearPendingEmail,
  getPendingEmail,
  setPendingEmail,
} from "@/lib/auth/pendingEmail";
import {
  clearAccessTokenCookie,
  setAccessTokenCookie,
} from "@/lib/auth/accessTokenCookie.server";
import { clearSession, getSession, setSession } from "@/lib/auth/session";
import type { AuthSession } from "@/lib/auth/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignInState = {
  error?: string;
  success?: string;
};

export async function signInWithEmail(
  _prev: SignInState | undefined,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }

  try {
    await sendMagicLinkApi(email);
    await setPendingEmail(email);
    return {
      success: "Check your email and click the sign-in link. You will be taken to the map.",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not send the magic link. Try again.";
    return { error: message };
  }
}

/** True when magic-link flow may need syncing from API-origin session cookie. */
export async function needsBackendSessionSync(): Promise<boolean> {
  const existing = await getSession();
  if (existing) return false;
  const email = await getPendingEmail();
  return Boolean(email);
}

export async function syncSessionFromBackend(backendRole: string): Promise<boolean> {
  const existing = await getSession();
  if (existing) return false;

  const email = await getPendingEmail();
  if (!email) return false;

  const role = roleFromBackend(backendRole);
  const session: AuthSession = {
    email,
    role,
    nickname: defaultNicknameForEmail(email, role),
  };
  await setSession(session);
  await clearPendingEmail();
  return true;
}

export type EstablishSessionResult =
  | { ok: true }
  | { ok: false; reason: "missing-email" };

/** Sets `ghm_session` + JWT cookie after magic-link verify. Does not redirect. */
export async function establishSessionAfterVerify(
  backendRole: string,
  accessToken?: string | null,
): Promise<EstablishSessionResult> {
  const email = await getPendingEmail();
  if (!email) {
    return { ok: false, reason: "missing-email" };
  }

  const role = roleFromBackend(backendRole);
  const session: AuthSession = {
    email,
    role,
    nickname: defaultNicknameForEmail(email, role),
  };
  await setSession(session);
  if (accessToken?.trim()) {
    await setAccessTokenCookie(accessToken.trim());
  }
  await clearPendingEmail();
  return { ok: true };
}

export type UpdateNicknameState = {
  error?: string;
  success?: boolean;
};

export async function syncProfileNickname(nickname: string): Promise<UpdateNicknameState> {
  const session = await getSession();
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

  await setSession({ ...session, nickname: name });
  return { success: true };
}

export async function fetchCurrentSession(): Promise<AuthSession | null> {
  return getSession();
}

export async function clearLocalSession(): Promise<void> {
  await clearSession();
  await clearAccessTokenCookie();
  await clearPendingEmail();
}

export async function signOut(): Promise<void> {
  await clearLocalSession();
  redirect(routes.login);
}
