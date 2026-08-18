import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getOrCreateApproveToken } from "@/lib/server/db";
import { publicOrigin } from "@/lib/server/base-url";

export const dynamic = "force-dynamic";

/** Mint (or reuse) this project's client-approval link. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const token = getOrCreateApproveToken(user.email, id);
  if (!token) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ url: `${publicOrigin(req)}/approve/${token}` });
}
