/**
 * Social audit engine: takes a normalized post history and produces a graded
 * virality report — deterministic statistics always, LLM coaching on top when
 * a key is connected (same fallback contract as generation).
 *
 * The audit doubles as a flywheel bootstrap: a creator's proven winning
 * titles become exemplars for future generations immediately, instead of
 * waiting for manually recorded results.
 */

import { llmComplete, scoreHook } from "./generate";
import { latestAuditReport } from "./db";

export interface AuditPost {
  title: string;
  publishedAt: string; // ISO-ish
  views: number;
  likes: number;
  comments: number;
}

export interface AuditSection {
  key: "hooks" | "consistency" | "timing" | "format" | "engagement";
  score: number; // 0-100
  note: string;
}

export interface AuditReport {
  source: string;
  label: string;
  createdAt: string;
  posts: number;
  totalViews: number;
  avgViews: number;
  engagementRate: number; // percent
  grade: number; // 0-100
  sections: AuditSection[];
  findings: string[];
  top: { title: string; views: number; likes: number; comments: number; hint: string }[];
  bottom: { title: string; views: number; likes: number; comments: number; hint: string }[];
  bestDay: string | null;
  llm: {
    engine: string;
    insights: string[];
    rewrites: { original: string; improved: string }[];
    plan: string[];
  } | null;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function hookHint(title: string): string {
  const parts: string[] = [`hook score ${scoreHook(title)}`];
  if (/\?/.test(title)) parts.push("question");
  if (/\d/.test(title)) parts.push("number");
  if (title.length >= 30 && title.length <= 65) parts.push("good length");
  else if (title.length > 65) parts.push("long title");
  return parts.join(" · ");
}

export function runAudit(
  source: string,
  label: string,
  raw: AuditPost[]
): AuditReport {
  const posts = raw
    .filter((p) => p.title && Number.isFinite(p.views))
    .sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, 100);

  const totalViews = posts.reduce((s, p) => s + p.views, 0);
  const avgViews = posts.length ? totalViews / posts.length : 0;
  const totalEng = posts.reduce((s, p) => s + p.likes + p.comments, 0);
  const engagementRate = totalViews > 0 ? (totalEng / totalViews) * 100 : 0;

  const byViews = [...posts].sort((a, b) => b.views - a.views);
  const top = byViews.slice(0, 5).map((p) => ({ ...p, hint: hookHint(p.title) }));
  const bottom = byViews
    .slice(-5)
    .reverse()
    .map((p) => ({ ...p, hint: hookHint(p.title) }));

  const findings: string[] = [];

  // Hooks: how strong are the titles, and do the winners out-hook the losers?
  const avgHook =
    posts.reduce((s, p) => s + scoreHook(p.title), 0) / Math.max(1, posts.length);
  const hooksScore = clamp((avgHook / 7) * 100);
  const topHook = top.reduce((s, p) => s + scoreHook(p.title), 0) / Math.max(1, top.length);
  const botHook =
    bottom.reduce((s, p) => s + scoreHook(p.title), 0) / Math.max(1, bottom.length);
  if (topHook > botHook + 1) {
    findings.push(
      `Your winners average hook score ${topHook.toFixed(1)} vs ${botHook.toFixed(1)} for your weakest posts — stronger hooks are measurably driving your views.`
    );
  }
  if (avgHook < 4) {
    findings.push(
      "Most titles lack proven hook elements (questions, numbers, curiosity words). This is your single biggest lever."
    );
  }

  // Consistency: median gap between posts.
  const times = posts
    .map((p) => new Date(p.publishedAt).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) gaps.push((times[i] - times[i - 1]) / 86400000);
  gaps.sort((a, b) => a - b);
  const medianGap = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 999;
  const maxGap = gaps.length ? Math.max(...gaps) : 0;
  const consistencyScore = clamp(
    medianGap <= 2 ? 100 : medianGap <= 4 ? 85 : medianGap <= 7 ? 70 : medianGap <= 14 ? 45 : 20
  );
  if (medianGap > 7) {
    findings.push(
      `You post roughly every ${Math.round(medianGap)} days — algorithms reward weekly-or-better cadence, and gaps up to ${Math.round(maxGap)} days reset your momentum.`
    );
  }

  // Timing: do top posts cluster on a day?
  const dayCounts = new Map<number, number>();
  for (const p of byViews.slice(0, Math.max(3, Math.floor(posts.length / 4)))) {
    const d = new Date(p.publishedAt).getDay();
    if (!Number.isNaN(d)) dayCounts.set(d, (dayCounts.get(d) ?? 0) + 1);
  }
  const bestDayEntry = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const bestDay = bestDayEntry ? DAYS[bestDayEntry[0]] : null;
  const timingScore = bestDayEntry
    ? clamp(40 + (bestDayEntry[1] / Math.max(1, Math.floor(posts.length / 4))) * 60)
    : 50;
  if (bestDay && bestDayEntry[1] >= 2) {
    findings.push(`Your top performers cluster on ${bestDay} — protect that slot.`);
  }

  // Format: title length sweet spot (30-65 chars).
  const sweet = posts.filter((p) => p.title.length >= 30 && p.title.length <= 65).length;
  const formatScore = clamp((sweet / Math.max(1, posts.length)) * 100);
  if (formatScore < 50) {
    findings.push(
      "Under half your titles sit in the 30-65 character sweet spot where click-through peaks."
    );
  }

  // Engagement vs. a rough cross-platform benchmark (~4% is healthy).
  const engagementScore = clamp((engagementRate / 4) * 100);
  if (engagementRate < 2 && totalViews > 0) {
    findings.push(
      `Engagement rate is ${engagementRate.toFixed(1)}% — below the ~4% healthy line. Stronger CTAs and comment-bait questions lift this fastest.`
    );
  }

  const sections: AuditSection[] = [
    { key: "hooks", score: hooksScore, note: `avg hook score ${avgHook.toFixed(1)}/7` },
    {
      key: "consistency",
      score: consistencyScore,
      note: gaps.length ? `median gap ${medianGap.toFixed(1)} days` : "not enough posts",
    },
    { key: "timing", score: timingScore, note: bestDay ? `best day: ${bestDay}` : "no clear pattern" },
    { key: "format", score: formatScore, note: `${sweet}/${posts.length} titles in the sweet spot` },
    {
      key: "engagement",
      score: engagementScore,
      note: `${engagementRate.toFixed(1)}% engagement rate`,
    },
  ];

  const grade = clamp(
    hooksScore * 0.3 +
      engagementScore * 0.25 +
      consistencyScore * 0.2 +
      timingScore * 0.15 +
      formatScore * 0.1
  );

  return {
    source,
    label,
    createdAt: new Date().toISOString(),
    posts: posts.length,
    totalViews,
    avgViews: Math.round(avgViews),
    engagementRate: Math.round(engagementRate * 10) / 10,
    grade,
    sections,
    findings,
    top,
    bottom,
    bestDay,
    llm: null,
  };
}

const AUDIT_SYSTEM = `You are Virafold's virality coach. You are given a creator's social post history summary: their top and bottom performers with stats, and computed weaknesses. Produce a candid, specific audit. Respond as JSON: {"insights": [4-6 sharp observations about what separates their winners from losers — reference their actual titles], "rewrites": [{"original": "<one of their 5 weakest titles>", "improved": "<a stronger rewrite that keeps the topic but adds a proven hook>"} for each of the 5 weakest], "plan": [5-7 concrete actions for the next 30 days, ordered by impact]}. Never use generic filler; every line must be actionable and tied to their data.`;

const AUDIT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["insights", "rewrites", "plan"],
  properties: {
    insights: { type: "array", items: { type: "string" } },
    rewrites: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["original", "improved"],
        properties: {
          original: { type: "string" },
          improved: { type: "string" },
        },
      },
    },
    plan: { type: "array", items: { type: "string" } },
  },
} as const;

/** LLM coaching layer; leaves report.llm null when no key or on any failure. */
export async function addLlmInsights(report: AuditReport): Promise<AuditReport> {
  try {
    const fmt = (p: { title: string; views: number; likes: number; comments: number }) =>
      `"${p.title}" — ${p.views} views, ${p.likes} likes, ${p.comments} comments`;
    const prompt = `Creator audit for ${report.label} (${report.source}), ${report.posts} posts, avg ${report.avgViews} views, ${report.engagementRate}% engagement.

TOP PERFORMERS:
${report.top.map(fmt).join("\n")}

WEAKEST POSTS:
${report.bottom.map(fmt).join("\n")}

COMPUTED WEAKNESSES:
${report.findings.join("\n") || "(none flagged)"}
Section scores: ${report.sections.map((s) => `${s.key} ${s.score}/100`).join(", ")}`;

    const res = await llmComplete(AUDIT_SYSTEM, prompt, AUDIT_SCHEMA);
    if (!res) return report;
    const start = res.text.indexOf("{");
    const end = res.text.lastIndexOf("}");
    if (start === -1 || end === -1) return report;
    const parsed = JSON.parse(res.text.slice(start, end + 1)) as {
      insights?: unknown;
      rewrites?: unknown;
      plan?: unknown;
    };
    const strArr = (v: unknown) =>
      Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 8) : [];
    const rewrites = Array.isArray(parsed.rewrites)
      ? parsed.rewrites
          .filter(
            (r): r is { original: string; improved: string } =>
              !!r && typeof r.original === "string" && typeof r.improved === "string"
          )
          .slice(0, 5)
      : [];
    return {
      ...report,
      llm: {
        engine: res.engine,
        insights: strArr(parsed.insights),
        rewrites,
        plan: strArr(parsed.plan),
      },
    };
  } catch {
    return report;
  }
}

/**
 * The creator's proven winning titles from their latest audit — merged into
 * generation exemplars so historical winners steer output from day one.
 */
export function auditExemplars(email: string, limit = 5): string[] {
  const latest = latestAuditReport(email);
  if (!latest) return [];
  try {
    const report = JSON.parse(latest.report) as AuditReport;
    return report.top.slice(0, limit).map((t) => t.title);
  } catch {
    return [];
  }
}
