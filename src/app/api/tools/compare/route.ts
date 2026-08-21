import { NextRequest, NextResponse } from "next/server";
import { runAudit } from "@/lib/server/audit";
import { fetchYouTube } from "@/lib/server/audit-sources";
import { insertEvent } from "@/lib/server/db";
import { rateLimit, clientIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Free channel head-to-head: two public YouTube channels, two deterministic
 * audit grades, side by side. Double YouTube quota per run, so the per-IP
 * limit is strict.
 */
export async function POST(req: NextRequest) {
  const gate = rateLimit(`cmp:${clientIp(req)}`, 3, 60 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Comparison limit reached — try again in an hour" },
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
  const handleA = String(b?.a ?? "").trim().slice(0, 200);
  const handleB = String(b?.b ?? "").trim().slice(0, 200);
  if (!handleA || !handleB) {
    return NextResponse.json({ error: "Enter both channel handles" }, { status: 400 });
  }

  const [resA, resB] = await Promise.all([fetchYouTube(handleA), fetchYouTube(handleB)]);
  if ("error" in resA || "error" in resB) {
    const which = "error" in resA ? handleA : handleB;
    return NextResponse.json(
      { error: `Could not fetch ${which} — check the handle` },
      { status: 422 }
    );
  }

  const pack = (label: string, posts: typeof resA.posts) => {
    const report = runAudit("youtube", label, posts);
    return {
      label: report.label,
      grade: report.grade,
      posts: report.posts,
      avgViews: report.avgViews,
      engagementRate: report.engagementRate,
      sections: report.sections.map((s) => ({ key: s.key, score: s.score })),
    };
  };

  const a = pack(resA.label, resA.posts);
  const b2 = pack(resB.label, resB.posts);
  insertEvent("tool_compare", "/tools/channel-compare", `${a.grade}v${b2.grade}`);
  return NextResponse.json({ a, b: b2 });
}
