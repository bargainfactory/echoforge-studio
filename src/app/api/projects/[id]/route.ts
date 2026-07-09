import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { updateProject, deleteProject } from "@/lib/server/db";
import type { Project } from "@/lib/data";

export const dynamic = "force-dynamic";

const ALLOWED_STATUS: Project["status"][] = [
  "uploading",
  "processing",
  "review",
  "published",
  "rejected",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const updates: Partial<Project> = {};

  if (typeof b.title === "string") updates.title = b.title;
  if (typeof b.eta === "string") updates.eta = b.eta;
  if (typeof b.progress === "number")
    updates.progress = Math.max(0, Math.min(100, b.progress));
  if (typeof b.assetsReady === "number")
    updates.assetsReady = Math.max(0, b.assetsReady);
  if (typeof b.status === "string" && ALLOWED_STATUS.includes(b.status as Project["status"]))
    updates.status = b.status as Project["status"];

  const project = updateProject(user.email, id, updates);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  deleteProject(user.email, id);
  return NextResponse.json({ ok: true });
}
