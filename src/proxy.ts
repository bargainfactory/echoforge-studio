import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/**
 * Server-side route protection (Next.js "proxy" — formerly "middleware"). The
 * dashboard is gated here, before any page code runs, by verifying the
 * HMAC-signed session cookie. A forged or expired cookie is rejected and the
 * request is redirected to /login. This replaces the old client-only
 * `if (!user)` check, which could be bypassed from the console.
 */
export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
