import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getAsset, updateAsset } from "@/lib/server/db";

export const dynamic = "force-dynamic";

const MAX_NAME = 200;
const MAX_CONTENT = 20000;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!getAsset(user.email, id)) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const updates: { name?: string; content?: string } = {};
  if (typeof b.name === "string" && b.name.trim()) {
    updates.name = b.name.trim().slice(0, MAX_NAME);
  }
  if (typeof b.content === "string") {
    updates.content = b.content.slice(0, MAX_CONTENT);
  }
  if (updates.name === undefined && updates.content === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const asset = updateAsset(user.email, id, updates);
  return NextResponse.json({ asset });
}
