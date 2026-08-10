import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getAsset, getProvenanceRaw } from "@/lib/server/db";
import {
  verifyManifest,
  type ProvenanceManifest,
} from "@/lib/server/provenance";

export const dynamic = "force-dynamic";

/** Returns the asset's signed provenance manifest plus a live signature check. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!getAsset(user.email, id)) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const raw = getProvenanceRaw(id);
  if (!raw) return NextResponse.json({ provenance: null });

  try {
    const manifest = JSON.parse(raw.manifest) as ProvenanceManifest;
    return NextResponse.json({
      provenance: {
        manifest,
        signature: raw.signature,
        valid: verifyManifest(manifest, raw.signature),
      },
    });
  } catch {
    return NextResponse.json({ provenance: null });
  }
}
