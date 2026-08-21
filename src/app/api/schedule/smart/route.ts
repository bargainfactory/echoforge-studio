import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  bestHoursByPlatform,
  createScheduledPost,
  listUnscheduledAssets,
} from "@/lib/server/db";

export const dynamic = "force-dynamic";

/**
 * Smart scheduling: per-platform best-hour recommendations from the
 * creator's own measured results (sensible defaults until data exists),
 * and one-click "Fill my week" distribution of ready assets.
 */

const DEFAULT_HOURS: Record<string, number> = {
  TikTok: 19,
  YouTube: 15,
  LinkedIn: 9,
  X: 10,
};

function bestHourMap(email: string): Record<string, { hour: number; source: string }> {
  const out: Record<string, { hour: number; source: string }> = {};
  for (const [platform, hour] of Object.entries(DEFAULT_HOURS)) {
    out[platform] = { hour, source: "default" };
  }
  const best: Record<string, { hour: number; avgViews: number }> = {};
  for (const row of bestHoursByPlatform(email)) {
    // Two measured posts at an hour is the minimum signal worth trusting.
    if (row.samples < 2) continue;
    if (!best[row.platform] || row.avgViews > best[row.platform].avgViews) {
      best[row.platform] = { hour: row.hour, avgViews: row.avgViews };
    }
  }
  for (const [platform, b] of Object.entries(best)) {
    out[platform] = { hour: b.hour, source: "your results" };
  }
  return out;
}

function platformForType(type: string): string | null {
  const t = type.toLowerCase();
  if (t.includes("short")) return "YouTube";
  if (t.includes("tiktok")) return "TikTok";
  if (t.includes("reel")) return "TikTok"; // Reels deliver via TikTok until a Meta connector exists
  if (t.includes("carousel") || t.includes("linkedin")) return "LinkedIn";
  if (t.includes("thread")) return "X";
  if (t.includes("newsletter") || t.includes("email")) return null; // broadcast, not a platform post
  return "X";
}

function stamp(d: Date, hour: number): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(hour)}:00`;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ bestTimes: bestHourMap(user.email) });
}

/** Fill the next 7 days: one ready asset per day at its platform's best hour. */
export async function POST(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hours = bestHourMap(user.email);
  const candidates = listUnscheduledAssets(user.email, 14)
    .map((a) => ({ asset: a, platform: platformForType(a.type) }))
    .filter((c): c is { asset: (typeof c)["asset"]; platform: string } => c.platform !== null)
    .slice(0, 7);

  if (!candidates.length) {
    return NextResponse.json(
      { error: "No unscheduled assets to place — generate or approve some first" },
      { status: 422 }
    );
  }

  const posts = candidates.map((c, i) => {
    const day = new Date();
    day.setDate(day.getDate() + i + 1);
    return createScheduledPost(user.email, {
      id: `sch-${crypto.randomUUID()}`,
      assetId: c.asset.id,
      assetName: c.asset.name,
      platform: c.platform,
      scheduledAt: stamp(day, hours[c.platform]?.hour ?? 12),
      status: "scheduled",
    });
  });

  return NextResponse.json({ posts, bestTimes: hours }, { status: 201 });
}
