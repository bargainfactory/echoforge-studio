import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  getIntegrationDef,
  saveIntegration,
  integrationStatus,
} from "@/lib/server/integrations";

export const dynamic = "force-dynamic";

/** Save keys/credentials for one integration (auth-gated). Secrets are stored
 *  server-side and never returned. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await params;
  if (!getIntegrationDef(name)) {
    return NextResponse.json({ error: "Unknown integration" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  saveIntegration(name, (body as Record<string, unknown>) ?? {});
  const status = integrationStatus().find((s) => s.name === name);
  return NextResponse.json({ status });
}
