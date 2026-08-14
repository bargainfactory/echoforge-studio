import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  clearSuggestedClips,
  getProjectMedia,
  insertClip,
  listClips,
  setProjectMedia,
} from "@/lib/server/db";
import { detectHighlights, estimateWords } from "@/lib/server/clips";
import { probeDuration } from "@/lib/server/render";
import { rateLimit } from "@/lib/server/rate-limit";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  return NextResponse.json({ clips: listClips(user.email, id) });
}

/** Detect the most clippable moments in this project's source video, steered
 *  by the creator's own proven winners. Replaces previous suggestions. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Each detection may invoke a paid LLM call.
  const gate = rateLimit(`clips:${user.email}`, 10, 60 * 60 * 1000);
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
      { error: "This project has no stored source video — upload one to clip it." },
      { status: 422 }
    );
  }
  if (!media.transcript && !media.words) {
    return NextResponse.json(
      { error: "This project has no transcript — connect a transcription key and re-upload." },
      { status: 422 }
    );
  }

  // Older projects may predate duration/word capture — probe and backfill.
  let duration = media.durationSec;
  if (!duration) {
    duration = await probeDuration(path.join(process.cwd(), media.storagePath));
    if (duration) setProjectMedia(user.email, id, { durationSec: duration });
  }
  if (!duration) {
    return NextResponse.json(
      { error: "Could not read the video's duration (is ffmpeg installed on the server?)" },
      { status: 500 }
    );
  }
  const words = media.words ?? estimateWords(media.transcript, duration);
  if (!words.length) {
    return NextResponse.json({ error: "Transcript is empty" }, { status: 422 });
  }

  const { clips, engine } = await detectHighlights(user.email, media.title, words, duration);
  clearSuggestedClips(user.email, id);
  const saved = clips.map((c) =>
    insertClip(user.email, {
      id: `clip-${crypto.randomUUID()}`,
      projectId: id,
      title: c.title,
      startSec: c.startSec,
      endSec: c.endSec,
      score: c.score,
      reason: c.reason,
      matched: c.matched,
      status: "suggested",
      style: "bold",
    })
  );
  return NextResponse.json({ clips: saved, engine });
}
