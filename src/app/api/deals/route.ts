import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { insertDeal, listDeals } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

export const DEAL_STAGES = ["lead", "negotiating", "booked", "delivered", "paid"] as const;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ deals: listDeals(user.email) });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = rateLimit(`deals:${user.email}`, 60, 10 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const brand = String(b?.brand ?? "").trim().slice(0, 100);
  if (!brand) return NextResponse.json({ error: "Brand is required" }, { status: 400 });
  const value = Math.max(0, Number(b?.value) || 0);

  const deal = insertDeal(user.email, {
    id: `deal-${crypto.randomUUID()}`,
    brand,
    contact: String(b?.contact ?? "").trim().slice(0, 200),
    value: Math.round(value * 100) / 100,
    stage: "lead",
    platform: String(b?.platform ?? "").trim().slice(0, 40),
    notes: String(b?.notes ?? "").trim().slice(0, 1000),
  });
  return NextResponse.json({ deal }, { status: 201 });
}
