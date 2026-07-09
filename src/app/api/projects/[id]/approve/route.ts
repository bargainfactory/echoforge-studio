import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  updateProject,
  setProjectAssetsStatus,
  insertNotification,
} from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Approve & publish: flips the project to published and its assets to live. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const publishedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const project = updateProject(user.email, id, {
    status: "published",
    progress: 100,
    eta: `Published ${publishedDate}`,
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  setProjectAssetsStatus(user.email, id, "live");
  insertNotification(user.email, {
    id: `n-${crypto.randomUUID()}`,
    title: "Project Published",
    message: "Assets are now live and being distributed to all platforms.",
    time: "Just now",
    read: false,
    type: "success",
  });

  return NextResponse.json({ project });
}
