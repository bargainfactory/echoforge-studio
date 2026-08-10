import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  getAsset,
  getProvenanceRaw,
  setProvenance,
  updateAsset,
} from "@/lib/server/db";
import {
  appendAction,
  signManifest,
  type ProvenanceManifest,
} from "@/lib/server/provenance";

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

  // Manual content edits become part of the signed action trail. Legacy assets
  // without a manifest simply stay without one.
  if (asset && updates.content !== undefined) {
    const raw = getProvenanceRaw(id);
    if (raw) {
      try {
        const manifest = appendAction(
          JSON.parse(raw.manifest) as ProvenanceManifest,
          updates.content,
          { action: "edited", at: new Date().toISOString() }
        );
        setProvenance(id, JSON.stringify(manifest), signManifest(manifest));
      } catch {
        /* corrupt stored manifest — leave as-is rather than fabricate */
      }
    }
  }

  return NextResponse.json({ asset });
}
