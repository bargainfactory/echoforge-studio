import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  insertProject,
  insertNotification,
  listProjects,
} from "@/lib/server/db";
import type { Project } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ projects: listProjects(user.email) });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const title = String(b?.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const assetsTotal = Math.min(
    24,
    Math.max(1, Number(b?.assetsTotal) || 8)
  );

  const project: Project = {
    id: `proj-${crypto.randomUUID()}`,
    title,
    status: "processing",
    progress: 0,
    assetsReady: 0,
    assetsTotal,
    eta: "Processing...",
    createdAt: new Date().toISOString(),
    fileName: b?.fileName ? String(b.fileName) : undefined,
    fileSize: b?.fileSize ? String(b.fileSize) : undefined,
  };

  insertProject(user.email, project);
  insertNotification(user.email, {
    id: `n-${crypto.randomUUID()}`,
    title: "New Project",
    message: `"${project.title}" has been uploaded and is now processing.`,
    time: "Just now",
    read: false,
    type: "info",
  });

  return NextResponse.json({ project }, { status: 201 });
}
