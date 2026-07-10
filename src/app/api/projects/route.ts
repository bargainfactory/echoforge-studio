import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { getSessionUser } from "@/lib/server/auth";
import {
  createProjectWithAssets,
  insertNotification,
  listProjects,
} from "@/lib/server/db";
import { generateAssets } from "@/lib/server/generate";

export const dynamic = "force-dynamic";

// Cap the raw upload we persist to disk (the transcript, not the media, drives
// generation — so a large media file is stored for reference only).
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200 MB

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ projects: listProjects(user.email) });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  let title = "";
  let transcript = "";
  let locale = "en";
  let fileName: string | undefined;
  let fileSize: string | undefined;
  let storagePath: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    title = String(form.get("title") ?? "").trim();
    transcript = String(form.get("transcript") ?? "").trim();
    locale = String(form.get("locale") ?? "en").slice(0, 8);
    const file = form.get("file");
    if (file && typeof file === "object" && "arrayBuffer" in file) {
      const f = file as File;
      if (f.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "File exceeds the 200 MB upload limit for this demo" },
          { status: 413 }
        );
      }
      fileName = f.name;
      fileSize = `${(f.size / (1024 * 1024)).toFixed(1)} MB`;
      // Persist the real bytes under data/uploads/<user>/<project>/.
      try {
        const bytes = Buffer.from(await f.arrayBuffer());
        const dir = path.join(
          process.cwd(),
          "data",
          "uploads",
          Buffer.from(user.email).toString("hex").slice(0, 24)
        );
        fs.mkdirSync(dir, { recursive: true });
        const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "upload.bin";
        const dest = path.join(dir, `${Date.now()}-${safe}`);
        fs.writeFileSync(dest, bytes);
        storagePath = path.relative(process.cwd(), dest);
      } catch {
        /* storage is best-effort; generation still proceeds */
      }
    }
  } else {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const b = body as Record<string, unknown>;
    title = String(b?.title ?? "").trim();
    transcript = String(b?.transcript ?? "").trim();
    locale = String(b?.locale ?? "en").slice(0, 8);
    fileName = b?.fileName ? String(b.fileName) : undefined;
    fileSize = b?.fileSize ? String(b.fileSize) : undefined;
  }

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // Real generation from the actual input content, in the user's language.
  const generated = await generateAssets(title, transcript, locale);

  const { project, assets } = createProjectWithAssets(
    user.email,
    {
      id: `proj-${crypto.randomUUID()}`,
      title,
      fileName,
      fileSize,
      transcript: transcript || undefined,
      storagePath,
    },
    generated
  );

  insertNotification(user.email, {
    id: `n-${crypto.randomUUID()}`,
    title: "Assets Ready for Review",
    message: `"${project.title}" generated ${assets.length} assets — ready to review.`,
    time: "Just now",
    read: false,
    type: "success",
  });

  return NextResponse.json({ project, assets }, { status: 201 });
}
