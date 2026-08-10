import { NextRequest, NextResponse } from "next/server";
import { resolveField } from "@/lib/server/integrations";
import { findUser, createUser, seedUser, consumePendingPlan } from "@/lib/server/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  hashPassword,
  initialsFor,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, origin));

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("g_state")?.value;
  if (!code || !state || state !== cookieState) return fail("google_failed");

  const clientId = resolveField("google-oauth", "clientId");
  const clientSecret = resolveField("google-oauth", "clientSecret");
  if (!clientId || !clientSecret) return fail("google_unavailable");

  try {
    // Exchange the code for an access token.
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tok = await tokenRes.json();
    if (!tok.access_token) return fail("google_failed");

    // Fetch the profile.
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    });
    const info = await infoRes.json();
    const email = String(info.email ?? "").toLowerCase();
    if (!email) return fail("google_failed");
    const name = String(info.name || email.split("@")[0]);

    // Find or create the user (OAuth accounts get a random password hash).
    let user = findUser(email);
    if (!user) {
      const passwordHash = await hashPassword(crypto.randomUUID());
      const plan = consumePendingPlan(email) ?? "Starter";
      createUser({ email, name, passwordHash, plan, createdAt: new Date().toISOString() });
      seedUser(email);
      user = findUser(email)!;
    }

    const sessionUser = {
      name: user.name,
      email: user.email,
      initials: initialsFor(user.name),
      plan: user.plan,
    };
    const token = await createSessionToken(sessionUser);

    const res = NextResponse.redirect(new URL("/dashboard", origin));
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    res.cookies.set("g_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch {
    return fail("google_failed");
  }
}
