import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { transcribeMedia } from "@/lib/server/transcribe";
import { estimateWords } from "@/lib/server/clips";
import {
  probeDuration,
  renderCaptionOnly,
  CAPTION_POSITIONS,
  CAPTION_STYLES,
  type CaptionPosition,
  type CaptionStyle,
} from "@/lib/server/render";
import { getFlags, insertEvent } from "@/lib/server/db";
import { rateLimit, clientIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024; // Whisper-compatible cap
const MAX_SECONDS = 95;
const RENDERS_DIR = path.join(process.cwd(), "data", "renders");

/**
 * Free auto-subtitle tool: short video in, the same video back with burned
 * captions and a small watermark. Transcription is a paid provider call, so
 * the limits are tight; signed-in captioning (full length, no watermark)
 * lives in Clip Studio.
 */
export async function POST(req: NextRequest) {
  if (!getFlags().generationEnabled) {
    return NextResponse.json({ error: "Temporarily disabled" }, { status: 503 });
  }
  const gate = rateLimit(`cap:${clientIp(req)}`, 3, 60 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Free limit reached — try again in an hour, or sign up for full-length captioning" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
    return NextResponse.json({ error: "Attach a video file" }, { status: 400 });
  }
  const f = file as File;
  if (f.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Free tool takes videos up to 25 MB (~90 seconds) — sign up for full-length" },
      { status: 413 }
    );
  }
  const styleRaw = String(form?.get("style") ?? "bold");
  const posRaw = String(form?.get("position") ?? "bottom");
  const style = (CAPTION_STYLES as readonly string[]).includes(styleRaw)
    ? (styleRaw as CaptionStyle)
    : "bold";
  const position = (CAPTION_POSITIONS as readonly string[]).includes(posRaw)
    ? (posRaw as CaptionPosition)
    : "bottom";

  const bytes = Buffer.from(await f.arrayBuffer());
  const tr = await transcribeMedia(bytes, f.name, f.type);
  if (!tr) {
    return NextResponse.json(
      { error: "Transcription is warming up — try again shortly" },
      { status: 503 }
    );
  }

  fs.mkdirSync(RENDERS_DIR, { recursive: true });
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const ext = (path.extname(f.name) || ".mp4").slice(0, 6).replace(/[^.a-z0-9]/gi, "") || ".mp4";
  const srcAbs = path.join(RENDERS_DIR, `tool-cap-${id}-src${ext}`);
  fs.writeFileSync(srcAbs, bytes);

  try {
    const duration = tr.durationSec ?? (await probeDuration(srcAbs));
    if (!duration) {
      return NextResponse.json({ error: "Could not read that video" }, { status: 422 });
    }
    if (duration > MAX_SECONDS) {
      return NextResponse.json(
        { error: "Free tool caps at 90 seconds — sign up for full-length captioning" },
        { status: 413 }
      );
    }
    const words = tr.words ?? estimateWords(tr.text, duration);
    if (!words.length) {
      return NextResponse.json({ error: "No speech detected in that video" }, { status: 422 });
    }

    const outAbs = path.join(RENDERS_DIR, `tool-cap-${id}.mp4`);
    const r = await renderCaptionOnly(srcAbs, words, style, position, outAbs, {
      watermark: true,
    });
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });

    insertEvent("tool_caption", "/tools/caption-generator", String(Math.round(duration)));
    return NextResponse.json({ id });
  } finally {
    fs.rmSync(srcAbs, { force: true });
  }
}
