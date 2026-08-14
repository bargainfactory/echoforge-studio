import { NextRequest, NextResponse } from "next/server";
import { runAudit } from "@/lib/server/audit";
import { fetchYouTube } from "@/lib/server/audit-sources";
import { insertEvent, insertPublicAudit } from "@/lib/server/db";
import { rateLimit, clientIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Public lead-magnet audit: no account needed, deterministic layer only —
 * the LLM coach (rewrites, 30-day plan) is the signup incentive, which also
 * means anonymous traffic can never spend LLM tokens. YouTube quota is
 * protected by a per-IP limit.
 */
export async function POST(req: NextRequest) {
  const gate = rateLimit(`padt:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const handle = String((body as Record<string, unknown>)?.handle ?? "")
    .trim()
    .slice(0, 200);
  if (!handle) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const result = await fetchYouTube(handle);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === "no_key" ? 503 : 422 }
    );
  }

  const report = runAudit("youtube", result.label, result.posts);
  insertEvent("audit_public", "/", handle.slice(0, 100));

  // Trimmed public shape: enough to prove value, not the whole coached report.
  const publicReport = {
    label: report.label,
    grade: report.grade,
    posts: report.posts,
    avgViews: report.avgViews,
    engagementRate: report.engagementRate,
    sections: report.sections,
    findings: report.findings.slice(0, 4),
    top: report.top.slice(0, 3),
    bottom: report.bottom.slice(0, 3),
  };

  // Every result gets a permanent shareable score card — the viral loop.
  const shareId = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  insertPublicAudit(shareId, report.label, report.grade, JSON.stringify(publicReport));

  return NextResponse.json({
    report: publicReport,
    shareUrl: `${req.nextUrl.origin}/a/${shareId}`,
  });
}
