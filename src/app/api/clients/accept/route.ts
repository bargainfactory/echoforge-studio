import { NextRequest, NextResponse } from "next/server";
import { getRealSessionUser } from "@/lib/server/auth";
import { activateManagedLink, insertNotification } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Client approves a pending management request. */
export async function POST(req: NextRequest) {
  const user = await getRealSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const manager = String((body as Record<string, unknown>)?.manager ?? "")
    .trim()
    .toLowerCase();
  if (!manager) return NextResponse.json({ error: "manager is required" }, { status: 400 });

  if (!activateManagedLink(manager, user.email)) {
    return NextResponse.json({ error: "No pending request from that account" }, { status: 404 });
  }
  insertNotification(manager, {
    id: `n-${crypto.randomUUID()}`,
    title: "Client Access Approved",
    message: `${user.name} (${user.email}) approved your management request — they now appear in your client switcher.`,
    time: "Just now",
    read: false,
    type: "success",
  });
  return NextResponse.json({ ok: true });
}
