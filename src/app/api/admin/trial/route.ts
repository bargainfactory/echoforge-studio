import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/auth";
import {
  cancelTrial,
  grantTrial,
  insertAudit,
  insertNotification,
  listUsers,
} from "@/lib/server/db";

export const dynamic = "force-dynamic";

// Paid tiers an operator may gift; the trial reverts automatically on expiry.
const TRIAL_PLANS = new Set(["Lite", "Starter", "Creator Pro", "Agency"]);
const MAX_DAYS = 90;

/** Grant a timed free trial to a chosen user. */
export async function POST(req: NextRequest) {
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
  const days = Math.round(Number(b?.days ?? 0));
  if (!email || !TRIAL_PLANS.has(plan) || !Number.isFinite(days) || days < 1 || days > MAX_DAYS) {
    return NextResponse.json(
      { error: `email, a paid plan, and 1–${MAX_DAYS} days are required` },
      { status: 400 }
    );
  }

  if (!grantTrial(email, plan, days)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const ends = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  insertAudit(admin.email, "user.trial", `${email} → ${plan} for ${days}d`);
  insertNotification(email, {
    id: `n-${crypto.randomUUID()}`,
    title: "Free Trial Unlocked",
    message: `You've been upgraded to ${plan} free until ${ends.toLocaleDateString()}. All ${plan} limits are live on your account right now — enjoy!`,
    time: "Just now",
    read: false,
    type: "success",
  });
  return NextResponse.json({ users: listUsers() });
}

/** End an active trial immediately (reverts to the pre-trial plan). */
export async function DELETE(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const email = String((body as Record<string, unknown>)?.email ?? "").trim();
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const result = cancelTrial(email);
  if (!result) {
    return NextResponse.json({ error: "No active trial for this user" }, { status: 404 });
  }
  insertAudit(admin.email, "user.trial_end", `${email} → back to ${result.reverted}`);
  return NextResponse.json({ users: listUsers() });
}
