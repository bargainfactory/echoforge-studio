import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getClip, updateClip } from "@/lib/server/db";
import { CAPTION_STYLES, kickRenderWorker, type CaptionStyle } from "@/lib/server/render";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/** Queue a clip for rendering with the chosen caption style. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Renders are CPU work on a shared box; bound per-account volume.
  const gate = rateLimit(`render:${user.email}`, 20, 60 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  const { id } = await params;
  const clip = getClip(user.email, id);
  if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (clip.status === "rendering" || clip.status === "queued") {
    return NextResponse.json({ clip });
  }

  let style: CaptionStyle = "bold";
  try {
    const body = (await req.json()) as { style?: string };
    if (body?.style && (CAPTION_STYLES as readonly string[]).includes(body.style)) {
      style = body.style as CaptionStyle;
    }
  } catch {
    /* default style */
  }

  updateClip(user.email, id, { status: "queued", style, error: null });
  kickRenderWorker();
  return NextResponse.json({ clip: getClip(user.email, id) });
}
