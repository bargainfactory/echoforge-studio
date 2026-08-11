import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { insertRevenue, listRevenue } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

export const REVENUE_STREAMS = [
  "adsense",
  "sponsorship",
  "affiliate",
  "products",
  "membership",
  "other",
] as const;

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ entries: listRevenue(user.email) });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = rateLimit(`revenue:${user.email}`, 60, 10 * 60 * 1000);
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
  const month = String(b?.month ?? "");
  const stream = String(b?.stream ?? "");
  const amount = Number(b?.amount);
  if (!MONTH_RE.test(month)) {
    return NextResponse.json({ error: "month must be YYYY-MM" }, { status: 400 });
  }
  if (!(REVENUE_STREAMS as readonly string[]).includes(stream)) {
    return NextResponse.json({ error: "Unknown revenue stream" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  const entry = insertRevenue(user.email, {
    id: `rev-${crypto.randomUUID()}`,
    month,
    stream,
    amount: Math.round(amount * 100) / 100,
    note: String(b?.note ?? "").slice(0, 200),
  });
  return NextResponse.json({ entry }, { status: 201 });
}
