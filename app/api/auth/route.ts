import { NextRequest, NextResponse } from "next/server";

import { sendMagicLink as sendMagicLinkApi } from "@/api/routes/auth.api";
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

export async function GET(req: NextRequest) {
  const session = await getSession();

  if (req.nextUrl.searchParams.get("bootstrap") === "1") {
    const pendingEmail = await getPendingEmail();
    return NextResponse.json({
      session,
      pendingSync: !session && Boolean(pendingEmail),
    });
  }

  return NextResponse.json(session);
}

export async function DELETE() {
  await clearSession();
  await clearAccessTokenCookie();
  await clearPendingEmail();
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = String(body.action ?? "");

  if (action === "sign-in") {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    try {
      await sendMagicLinkApi(email);
      await setPendingEmail(email);
      return NextResponse.json({
        success:
          "Check your email and click the sign-in link. You will be taken to the map.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not send the magic link. Try again.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === "establish") {
    const backendRole = String(body.role ?? "");
    const accessToken = body.accessToken != null ? String(body.accessToken) : null;
    const email = await getPendingEmail();
    if (!email) {
      return NextResponse.json({ ok: false, reason: "missing-email" }, { status: 400 });
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
    return NextResponse.json({ ok: true });
  }

  if (action === "sync-backend") {
    const existing = await getSession();
    if (existing) {
      return NextResponse.json({ synced: false });
    }

    const email = await getPendingEmail();
    if (!email) {
      return NextResponse.json({ synced: false });
    }

    const role = roleFromBackend(String(body.backendRole ?? ""));
    const session: AuthSession = {
      email,
      role,
      nickname: defaultNicknameForEmail(email, role),
    };
    await setSession(session);
    await clearPendingEmail();
    return NextResponse.json({ synced: true });
  }

  if (action === "nickname") {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
    }

    const name = String(body.nickname ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Nickname cannot be empty." }, { status: 400 });
    }
    if (name.length > 32) {
      return NextResponse.json({ error: "Nickname must be 32 characters or less." }, { status: 400 });
    }

    await setSession({ ...session, nickname: name });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
