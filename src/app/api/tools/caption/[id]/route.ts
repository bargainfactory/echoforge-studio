import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

export const dynamic = "force-dynamic";

const RENDERS_DIR = path.join(process.cwd(), "data", "renders");

/** Serve a free-tool captioned video by its unguessable token. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[a-f0-9]{16}$/.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const abs = path.join(RENDERS_DIR, `tool-cap-${id}.mp4`);
  if (!fs.existsSync(abs)) {
    return NextResponse.json({ error: "Expired — captioned files are kept briefly" }, { status: 404 });
  }
  const stream = Readable.toWeb(fs.createReadStream(abs)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(fs.statSync(abs).size),
      "Content-Disposition": 'attachment; filename="captioned.mp4"',
    },
  });
}
