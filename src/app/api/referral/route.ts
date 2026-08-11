import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getReferralInfo } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code, count } = getReferralInfo(user.email);
  return NextResponse.json({
    code,
    count,
    link: `${req.nextUrl.origin}/?ref=${code}`,
  });
}
