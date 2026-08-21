import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  listAllClips,
  listAssets,
  listDeals,
  listIdeas,
  listProjects,
  listRevenue,
  listScheduledPosts,
} from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Data portability: the creator's whole body of work as one download.
 * ?format=markdown → every project's assets, ideas, and scripts as a readable
 * document. ?format=json → the complete structured account data. Rendered
 * videos are downloaded individually (they're large); this covers the words.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = rateLimit(`export:${user.email}`, 10, 60 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  const email = user.email;
  const projects = listProjects(email);
  const assets = listAssets(email);
  const ideas = listIdeas(email);
  const posts = listScheduledPosts(email);
  const clips = listAllClips(email).map((c) => ({
    id: c.id,
    title: c.title,
    kind: c.kind,
    status: c.status,
    projectId: c.projectId,
    createdAt: c.createdAt,
  }));
  const stamp = new Date().toISOString().slice(0, 10);

  const format = req.nextUrl.searchParams.get("format") ?? "markdown";
  if (format === "json") {
    const payload = {
      exportedAt: new Date().toISOString(),
      account: { email: user.email, name: user.name, plan: user.plan },
      projects,
      assets,
      ideas,
      scheduledPosts: posts,
      clips,
      revenue: listRevenue(email),
      deals: listDeals(email),
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="virafold-export-${stamp}.json"`,
      },
    });
  }

  const lines: string[] = [
    `# Virafold export — ${user.name}`,
    ``,
    `Exported ${new Date().toUTCString()}. ${assets.length} assets across ${projects.length} projects, plus ${ideas.length} ideas.`,
    ``,
  ];
  for (const p of projects) {
    lines.push(`## ${p.title}`, ``);
    const pa = assets.filter((a) => a.projectId === p.id);
    if (!pa.length) lines.push(`_No assets._`, ``);
    for (const a of pa) {
      lines.push(`### ${a.name} (${a.type})`, ``, a.content ?? "_(empty)_", ``);
    }
  }
  const orphanAssets = assets.filter((a) => !projects.some((p) => p.id === a.projectId));
  if (orphanAssets.length) {
    lines.push(`## Other assets`, ``);
    for (const a of orphanAssets) {
      lines.push(`### ${a.name} (${a.type})`, ``, a.content ?? "_(empty)_", ``);
    }
  }
  if (ideas.length) {
    lines.push(`## Ideas`, ``);
    for (const i of ideas) {
      lines.push(`### ${i.title} (score ${i.score})`, ``);
      if (i.notes) lines.push(i.notes, ``);
      if (i.script) lines.push(`**Script:**`, ``, i.script, ``);
    }
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="virafold-content-${stamp}.md"`,
    },
  });
}
