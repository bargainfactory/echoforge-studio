import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getAsset } from "@/lib/server/db";
import { lintContent } from "@/lib/server/policy-lint";

export const dynamic = "force-dynamic";

/**
 * On-demand policy lint for one asset. Computed fresh on every call so edits
 * and regenerations are never linted against stale stored results.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const asset = getAsset(user.email, id);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.json({ lint: lintContent(`${asset.name}\n${asset.content ?? ""}`) });
}
