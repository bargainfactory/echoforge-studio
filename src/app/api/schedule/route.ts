import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { listScheduledPosts, createScheduledPost } from "@/lib/server/db";

export const dynamic = "force-dynamic";

const PLATFORMS = new Set([
  "TikTok",
  "YouTube",
  "LinkedIn",
  "X",
]);

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ posts: listScheduledPosts(user.email) });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const assetId = String(b?.assetId ?? "");
  const assetName = String(b?.assetName ?? "Untitled asset");
  const platform = String(b?.platform ?? "");
  const scheduledAt = String(b?.scheduledAt ?? "");
  // Rendered clips schedule as video uploads instead of text posts.
  const clipId = b?.clipId ? String(b.clipId) : null;

  if (!assetId && !clipId)
    return NextResponse.json({ error: "Missing asset" }, { status: 400 });
  if (!PLATFORMS.has(platform))
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  if (!scheduledAt)
    return NextResponse.json({ error: "Missing schedule time" }, { status: 400 });

  const post = createScheduledPost(user.email, {
    id: `sch-${crypto.randomUUID()}`,
    assetId: assetId || `clip:${clipId}`,
    assetName,
    platform,
    scheduledAt,
    status: "scheduled",
    clipId,
  });
  return NextResponse.json({ post }, { status: 201 });
}
