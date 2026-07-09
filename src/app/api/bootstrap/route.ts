import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { listProjects, listAssets, listNotifications } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Single round-trip loader for the dashboard: user + all their data. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    user,
    projects: listProjects(user.email),
    assets: listAssets(user.email),
    notifications: listNotifications(user.email),
  });
}
