import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  CONNECTABLE,
  completeConnection,
  type ConnectablePlatform,
} from "@/lib/server/connect";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const { platform } = await params;
  if (!(CONNECTABLE as readonly string[]).includes(platform)) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 404 });
  }
  const p = platform as ConnectablePlatform;

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(`vf_oauth_state_${p}`)?.value;
  const verifier = req.cookies.get(`vf_oauth_verifier_${p}`)?.value;

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/dashboard?connect_error=${reason}`, req.url));

  if (!code || !state || !expectedState || state !== expectedState) {
    return fail("state_mismatch");
  }

  try {
    await completeConnection(user.email, p, code, verifier);
  } catch {
    return fail("exchange_failed");
  }

  const res = NextResponse.redirect(new URL(`/dashboard?connected=${p}`, req.url));
  res.cookies.delete(`vf_oauth_state_${p}`);
  res.cookies.delete(`vf_oauth_verifier_${p}`);
  return res;
}
