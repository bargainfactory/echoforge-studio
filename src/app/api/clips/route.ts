import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { listAllClips, listProjectsWithMedia } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Clip Studio bootstrap: which projects have a stored source video, plus
 *  every clip (suggested, rendering, ready) the creator has. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    projects: listProjectsWithMedia(user.email),
    clips: listAllClips(user.email),
  });
}
