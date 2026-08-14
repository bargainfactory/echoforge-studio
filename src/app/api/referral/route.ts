import { NextRequest, NextResponse } from "next/server";
import { publicOrigin } from "@/lib/server/base-url";
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
    link: `${publicOrigin(req)}/?ref=${code}`,
  });
}
