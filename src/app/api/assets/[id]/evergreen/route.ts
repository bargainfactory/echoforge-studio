import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getAsset, setAssetEvergreen } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Toggle evergreen recycling: after each publish, the scheduler re-queues
 *  evergreen assets automatically. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const asset = getAsset(user.email, id);
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  return NextResponse.json({
    asset: setAssetEvergreen(user.email, id, !asset.evergreen),
  });
}
