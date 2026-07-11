import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/auth";
import { integrationStatus } from "@/lib/server/integrations";

export const dynamic = "force-dynamic";

/** Secret-free status of every integration (ADMIN-only — the integrations panel
 *  manages shared platform config, so it is not exposed to ordinary users). */
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ integrations: integrationStatus() });
}
