import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/auth";
import { getFlags, insertAudit, setFlags } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const flags = {
    ...getFlags(),
    ...(b.generationEnabled !== undefined
      ? { generationEnabled: Boolean(b.generationEnabled) }
      : {}),
  };
  setFlags(flags);
  insertAudit(admin.email, "flags.update", JSON.stringify(flags));
  return NextResponse.json({ flags });
}
