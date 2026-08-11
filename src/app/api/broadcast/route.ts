import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  getAsset,
  getCreatorPageByEmail,
  insertNotification,
  listSubscribers,
} from "@/lib/server/db";
import { sendEmail, emailConfigured } from "@/lib/server/email";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

// Broadcasts fan out one email per subscriber — keep the per-account rate low.
const BROADCAST_LIMIT = 5;
const BROADCAST_WINDOW_MS = 60 * 60 * 1000;
const MAX_RECIPIENTS_PER_SEND = 500;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Send a generated asset (typically a newsletter) to the creator's list. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = rateLimit(`broadcast:${user.email}`, BROADCAST_LIMIT, BROADCAST_WINDOW_MS);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Broadcast limit reached. Please try again later." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const assetId = String((body as Record<string, unknown>)?.assetId ?? "");
  const asset = getAsset(user.email, assetId);
  if (!asset || !asset.content) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const subscribers = listSubscribers(user.email).slice(0, MAX_RECIPIENTS_PER_SEND);
  if (subscribers.length === 0) {
    return NextResponse.json({ error: "No subscribers yet" }, { status: 400 });
  }

  const senderName = getCreatorPageByEmail(user.email)?.displayName || user.name;
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;line-height:1.6;white-space:pre-wrap">${escapeHtml(asset.content)}</div><p style="font-family:sans-serif;color:#888;font-size:12px">Sent by ${escapeHtml(senderName)} via EchoForge</p>`;

  if (!emailConfigured()) {
    // Demo mode: report reach honestly instead of pretending to send.
    return NextResponse.json({ sent: 0, demo: true, subscribers: subscribers.length });
  }

  let sent = 0;
  for (const sub of subscribers) {
    const res = await sendEmail({ to: sub.email, subject: asset.name, html });
    if (res.sent) sent++;
  }

  insertNotification(user.email, {
    id: `n-${crypto.randomUUID()}`,
    title: "Broadcast Sent",
    message: `"${asset.name}" was emailed to ${sent} of ${subscribers.length} subscribers.`,
    time: "Just now",
    read: false,
    type: "success",
  });
  return NextResponse.json({ sent, demo: false, subscribers: subscribers.length });
}
