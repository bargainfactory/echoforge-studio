import { NextRequest, NextResponse } from "next/server";
import { consumeVerifyToken } from "@/lib/server/db";
import { publicOrigin } from "@/lib/server/base-url";

export const dynamic = "force-dynamic";

/** Landing point for the emailed confirmation link. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim() ?? "";
  const email = token ? consumeVerifyToken(token) : null;
  return NextResponse.redirect(
    `${publicOrigin(req)}/dashboard${email ? "?verified=1" : ""}`
  );
}
