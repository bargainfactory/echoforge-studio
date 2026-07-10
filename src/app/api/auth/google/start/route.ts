import { NextRequest, NextResponse } from "next/server";
import { resolveField, isConfigured } from "@/lib/server/integrations";

export const dynamic = "force-dynamic";

/** Kick off Google OAuth. If the Google key isn't connected, bounce back to
 *  /login with a clear message instead of failing. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!isConfigured("google-oauth")) {
    return NextResponse.redirect(new URL("/login?error=google_unavailable", origin));
  }
  const clientId = resolveField("google-oauth", "clientId")!;
  const state = crypto.randomUUID();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", `${origin}/api/auth/google/callback`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "online");

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("g_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
