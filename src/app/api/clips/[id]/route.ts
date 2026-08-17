import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getSessionUser } from "@/lib/server/auth";
import { deleteClip, getClip, getProjectMedia } from "@/lib/server/db";
import { estimateWords } from "@/lib/server/clips";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const clip = getClip(user.email, id);
  if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Words inside the clip window power the in-browser caption preview.
  // Same fallback chain as the renderer, so the preview matches the output.
  const media = getProjectMedia(user.email, clip.projectId);
  let words =
    media?.words ??
    (media?.transcript && media.durationSec
      ? estimateWords(media.transcript, media.durationSec)
      : []);
  words = words.filter((w) => w.e > clip.startSec - 0.5 && w.s < clip.endSec + 0.5);

  return NextResponse.json({ clip, words });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const clip = getClip(user.email, id);
  if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (clip.outputPath) {
    try {
      fs.rmSync(path.join(process.cwd(), clip.outputPath), { force: true });
    } catch {
      /* file cleanup is best-effort */
    }
  }
  deleteClip(user.email, id);
  return NextResponse.json({ ok: true });
}
