import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { getSessionUser } from "@/lib/server/auth";
import { getProjectMedia } from "@/lib/server/db";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
};

/**
 * Streams a project's stored source video/audio with HTTP Range support, so
 * the in-browser clip preview can seek straight to a suggested moment
 * without downloading the whole file.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const media = getProjectMedia(user.email, id);
  if (!media?.storagePath) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const abs = path.join(process.cwd(), media.storagePath);
  if (!fs.existsSync(abs)) {
    return NextResponse.json({ error: "Source file is missing" }, { status: 404 });
  }
  const size = fs.statSync(abs).size;
  const type = MIME[path.extname(abs).toLowerCase()] ?? "application/octet-stream";

  const range = req.headers.get("range");
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m?.[1] ? parseInt(m[1], 10) : 0;
    const end = Math.min(m?.[2] ? parseInt(m[2], 10) : size - 1, size - 1);
    if (Number.isNaN(start) || start >= size || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    const stream = Readable.toWeb(
      fs.createReadStream(abs, { start, end })
    ) as ReadableStream;
    return new NextResponse(stream, {
      status: 206,
      headers: {
        "Content-Type": type,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  const stream = Readable.toWeb(fs.createReadStream(abs)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
