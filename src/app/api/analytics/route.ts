import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { userAnalytics } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Real per-user workspace analytics — aggregates over the caller's own data. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(userAnalytics(user.email));
}
