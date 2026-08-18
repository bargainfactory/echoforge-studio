import { NextRequest, NextResponse } from "next/server";
import {
  getProjectByApproveToken,
  insertEvent,
  insertNotification,
} from "@/lib/server/db";
import { rateLimit, clientIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/** Client feedback on a shared project — no login, token-scoped. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const gate = rateLimit(`appr:${clientIp(req)}`, 30, 60 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  const { token } = await params;
  const proj = getProjectByApproveToken(token);
  if (!proj) return NextResponse.json({ error: "Link is invalid or expired" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const assetName = String(b?.assetName ?? "").slice(0, 200);
  const action = String(b?.action ?? "");
  const note = String(b?.note ?? "").slice(0, 1000);
  if (!assetName || (action !== "approve" && action !== "changes")) {
    return NextResponse.json({ error: "assetName and a valid action are required" }, { status: 400 });
  }

  insertNotification(proj.email, {
    id: `n-${crypto.randomUUID()}`,
    title: action === "approve" ? "Client Approved an Asset" : "Client Requested Changes",
    message:
      action === "approve"
        ? `"${assetName}" (${proj.title}) was approved via the client link.`
        : `"${assetName}" (${proj.title}): ${note || "changes requested via the client link."}`,
    time: "Just now",
    read: false,
    type: action === "approve" ? "success" : "warning",
  });
  insertEvent("client_feedback", `/approve`, action);
  return NextResponse.json({ ok: true });
}
