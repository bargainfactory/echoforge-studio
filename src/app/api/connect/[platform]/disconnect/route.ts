import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { deletePlatformAccount } from "@/lib/server/db";
import { CONNECTABLE } from "@/lib/server/connect";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platform } = await params;
  if (!(CONNECTABLE as readonly string[]).includes(platform)) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 404 });
  }
  deletePlatformAccount(user.email, platform);
  return NextResponse.json({ ok: true });
}
