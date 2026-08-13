import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { listPlatformAccounts } from "@/lib/server/db";
import { CONNECTABLE, platformCreds } from "@/lib/server/connect";

export const dynamic = "force-dynamic";

/** Connection status per platform: operator-configured? creator-connected? */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connected = new Map(
    listPlatformAccounts(user.email).map((a) => [a.platform, a])
  );
  return NextResponse.json({
    platforms: CONNECTABLE.map((p) => ({
      platform: p,
      configured: platformCreds(p) !== null,
      connected: connected.has(p),
      handle: connected.get(p)?.handle ?? null,
    })),
  });
}
