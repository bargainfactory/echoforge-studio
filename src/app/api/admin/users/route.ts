import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/auth";
import { insertAudit, listUsers, setUserPlan } from "@/lib/server/db";

export const dynamic = "force-dynamic";

// Plans an admin may assign — mirrors the priceIds in the pricing config plus
// the signup default.
const ALLOWED_PLANS = new Set(["Free", "Starter", "Lite", "Creator Pro", "Agency"]);

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ users: listUsers() });
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const email = String(b?.email ?? "").trim();
  const plan = String(b?.plan ?? "").trim();
  if (!email || !ALLOWED_PLANS.has(plan)) {
    return NextResponse.json({ error: "email and a valid plan are required" }, { status: 400 });
  }

  if (!setUserPlan(email, plan)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  insertAudit(admin.email, "user.plan", `${email} → ${plan}`);
  return NextResponse.json({ users: listUsers() });
}
