import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { integrationStatus } from "@/lib/server/integrations";

export const dynamic = "force-dynamic";

/** Secret-free status of every integration (auth-gated). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ integrations: integrationStatus() });
}
