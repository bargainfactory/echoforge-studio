import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getScheduledPost, upsertPostMetrics } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Manual performance-results entry for a published post. Platform-API
 * ingestion will later write to the same table with source "oauth:<platform>",
 * so everything downstream (top performers, exemplar-fed generation) is
 * already source-agnostic.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = rateLimit(`metrics:${user.email}`, 60, 10 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const postId = String(b?.postId ?? "");

  const post = getScheduledPost(user.email, postId);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.status !== "published") {
    return NextResponse.json(
      { error: "Results can only be recorded for published posts" },
      { status: 400 }
    );
  }

  const clamp = (v: unknown) =>
    Math.max(0, Math.min(1_000_000_000, Math.round(Number(v) || 0)));
  upsertPostMetrics(user.email, postId, {
    views: clamp(b.views),
    likes: clamp(b.likes),
    comments: clamp(b.comments),
    source: "manual",
  });
  return NextResponse.json({ ok: true });
}
