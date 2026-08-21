import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getProjectMedia, insertCaptionJob } from "@/lib/server/db";
import {
  CAPTION_POSITIONS,
  CAPTION_STYLES,
  kickRenderWorker,
} from "@/lib/server/render";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/** Queue a caption-only render of this project's full source video. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = rateLimit(`render:${user.email}`, 20, 60 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  const { id } = await params;
  const media = getProjectMedia(user.email, id);
  if (!media) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!media.storagePath) {
    return NextResponse.json(
      { error: "This project has no stored source video" },
      { status: 422 }
    );
  }

  let style = "bold";
  let position = "bottom";
  try {
    const b = (await req.json()) as { style?: string; position?: string };
    if (b?.style && (CAPTION_STYLES as readonly string[]).includes(b.style)) style = b.style;
    if (b?.position && (CAPTION_POSITIONS as readonly string[]).includes(b.position)) {
      position = b.position;
    }
  } catch {
    /* defaults */
  }

  const clip = insertCaptionJob(user.email, {
    id: `cap-${crypto.randomUUID()}`,
    title: `${media.title} — captioned`,
    projectId: id,
    style,
    position,
  });
  kickRenderWorker();
  return NextResponse.json({ clip }, { status: 201 });
}
