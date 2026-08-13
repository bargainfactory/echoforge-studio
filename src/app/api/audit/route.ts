import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getFlags, insertAuditReport, latestAuditReport } from "@/lib/server/db";
import { addLlmInsights, runAudit } from "@/lib/server/audit";
import { fetchYouTube, parseAnalyticsCsv } from "@/lib/server/audit-sources";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const latest = latestAuditReport(user.email);
  if (!latest) return NextResponse.json({ report: null });
  try {
    return NextResponse.json({ report: JSON.parse(latest.report) });
  } catch {
    return NextResponse.json({ report: null });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = rateLimit(`audit:${user.email}`, 10, 60 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Too many audits — try again later" },
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
  const source = String(b?.source ?? "");

  let label = "";
  let posts;
  if (source === "youtube") {
    const handle = String(b?.handle ?? "").trim().slice(0, 200);
    if (!handle) return NextResponse.json({ error: "Enter a channel" }, { status: 400 });
    const result = await fetchYouTube(handle);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.error === "no_key" ? 503 : 422 });
    }
    label = result.label;
    posts = result.posts;
  } else if (source === "csv") {
    const text = String(b?.text ?? "").slice(0, 500_000);
    const result = parseAnalyticsCsv(text);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    label = String(b?.label ?? "").trim().slice(0, 80) || "Imported analytics";
    posts = result.posts;
  } else {
    return NextResponse.json({ error: "Unknown source" }, { status: 400 });
  }

  let report = runAudit(source, label, posts);
  // LLM coaching honors the operator kill switch; deterministic audit doesn't
  // cost anything and always runs.
  if (getFlags().generationEnabled) {
    report = await addLlmInsights(report);
  }

  insertAuditReport(user.email, source, label, report.grade, JSON.stringify(report));
  return NextResponse.json({ report }, { status: 201 });
}
