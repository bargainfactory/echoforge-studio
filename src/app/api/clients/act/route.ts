import { NextRequest, NextResponse } from "next/server";
import { getRealSessionUser, ACTING_COOKIE } from "@/lib/server/auth";
import { insertEvent, isActiveManager } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Switch the session into (or out of) a managed client account. */
export async function POST(req: NextRequest) {
  const user = await getRealSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const email = String((body as Record<string, unknown>)?.email ?? "")
    .trim()
    .toLowerCase();

  const res = NextResponse.json({ ok: true, acting: email || null });
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  if (!email) {
    res.cookies.set(ACTING_COOKIE, "", { ...cookieOpts, maxAge: 0 });
    return res;
  }
  if (!isActiveManager(user.email, email)) {
    return NextResponse.json(
      { error: "No active management link to that account" },
      { status: 403 }
    );
  }
  // 12h cap: delegation re-verifies per request anyway; the cookie just expires.
  res.cookies.set(ACTING_COOKIE, email, { ...cookieOpts, maxAge: 12 * 60 * 60 });
  insertEvent("act_as", user.email, email);
  return res;
}
