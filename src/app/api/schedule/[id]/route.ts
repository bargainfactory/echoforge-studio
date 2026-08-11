import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  setScheduledStatus,
  listScheduledPosts,
  updateScheduledPost,
} from "@/lib/server/db";
import { isConfigured } from "@/lib/server/integrations";

export const dynamic = "force-dynamic";

const PLATFORMS = new Set(["TikTok", "YouTube", "Instagram", "LinkedIn", "X"]);

/** Reschedule a pending post: change its platform and/or publish time. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const updates: { platform?: string; scheduledAt?: string } = {};
  if (b.platform !== undefined) {
    const platform = String(b.platform);
    if (!PLATFORMS.has(platform))
      return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
    updates.platform = platform;
  }
  if (b.scheduledAt !== undefined) {
    const scheduledAt = String(b.scheduledAt);
    if (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime()))
      return NextResponse.json({ error: "Invalid schedule time" }, { status: 400 });
    updates.scheduledAt = scheduledAt;
  }
  if (updates.platform === undefined && updates.scheduledAt === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const post = updateScheduledPost(user.email, id, updates);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post, posts: listScheduledPosts(user.email) });
}

/** Publish now (or cancel via ?action=cancel). Real delivery to the platform
 *  requires a connected publishing app + the user's platform account; when
 *  publishing isn't connected this marks the post published in demo mode. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const action = req.nextUrl.searchParams.get("action");
  const status = action === "cancel" ? "canceled" : "published";

  const post = setScheduledStatus(user.email, id, status);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    post,
    connected: isConfigured("publishing"),
    posts: listScheduledPosts(user.email),
  });
}
