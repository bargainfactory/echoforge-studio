import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/auth";
import { listAudit } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ entries: listAudit(200) });
}
