import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { markAllNotificationsRead } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  markAllNotificationsRead(user.email);
  return NextResponse.json({ ok: true });
}
