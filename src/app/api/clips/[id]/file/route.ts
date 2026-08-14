import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { getSessionUser } from "@/lib/server/auth";
import { getClip } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Serve the rendered clip: inline for the <video> preview, attachment with
 *  ?download=1. Streams rather than buffering — clips can be tens of MB. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const clip = getClip(user.email, id);
  if (!clip?.outputPath) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const abs = path.join(process.cwd(), clip.outputPath);
  if (!fs.existsSync(abs)) {
    return NextResponse.json({ error: "Rendered file is missing" }, { status: 404 });
  }
  const size = fs.statSync(abs).size;
  const download = req.nextUrl.searchParams.get("download") === "1";
  const safeName = `${clip.title.replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 60) || "clip"}.mp4`;

  const stream = Readable.toWeb(fs.createReadStream(abs)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(size),
      "Cache-Control": "private, max-age=3600",
      ...(download
        ? { "Content-Disposition": `attachment; filename="${safeName}"` }
        : { "Content-Disposition": "inline" }),
    },
  });
}
