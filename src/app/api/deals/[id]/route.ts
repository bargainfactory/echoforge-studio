import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  deleteDeal,
  getDeal,
  insertNotification,
  insertRevenue,
  updateDeal,
} from "@/lib/server/db";

export const dynamic = "force-dynamic";

const STAGES = new Set(["lead", "negotiating", "booked", "delivered", "paid"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = getDeal(user.email, id);
  if (!existing) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const updates: Parameters<typeof updateDeal>[2] = {};
  if (typeof b.brand === "string" && b.brand.trim())
    updates.brand = b.brand.trim().slice(0, 100);
  if (typeof b.contact === "string") updates.contact = b.contact.trim().slice(0, 200);
  if (b.value !== undefined)
    updates.value = Math.round(Math.max(0, Number(b.value) || 0) * 100) / 100;
  if (typeof b.platform === "string") updates.platform = b.platform.trim().slice(0, 40);
  if (typeof b.notes === "string") updates.notes = b.notes.trim().slice(0, 1000);
  if (typeof b.stage === "string" && STAGES.has(b.stage))
    updates.stage = b.stage as "lead" | "negotiating" | "booked" | "delivered" | "paid";
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const deal = updateDeal(user.email, id, updates);

  // Closing the loop: a deal marked paid becomes a revenue-ledger entry, so
  // the ledger reflects the pipeline without double bookkeeping.
  let revenueAdded = false;
  if (deal && updates.stage === "paid" && existing.stage !== "paid" && deal.value > 0) {
    insertRevenue(user.email, {
      id: `rev-${crypto.randomUUID()}`,
      month: new Date().toISOString().slice(0, 7),
      stream: "sponsorship",
      amount: deal.value,
      note: deal.brand,
    });
    revenueAdded = true;
    insertNotification(user.email, {
      id: `n-${crypto.randomUUID()}`,
      title: "Deal Paid",
      message: `"${deal.brand}" ($${deal.value}) was marked paid and added to your revenue ledger.`,
      time: "Just now",
      read: false,
      type: "success",
    });
  }

  return NextResponse.json({ deal, revenueAdded });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  deleteDeal(user.email, id);
  return NextResponse.json({ ok: true });
}
