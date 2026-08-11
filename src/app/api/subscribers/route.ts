import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { listSubscribers } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ subscribers: listSubscribers(user.email) });
}
