/**
 * Competitor watchlist: re-audits pinned public channels weekly, alerts when
 * a competitor lands a new winner, and feeds their proven titles into the
 * creator's generation exemplars as a niche swipe file.
 */

import { runAudit } from "./audit";
import { fetchYouTube } from "./audit-sources";
import {
  insertNotification,
  listWatchlist,
  updateWatchResult,
  type WatchEntry,
} from "./db";

/** Audits one watchlist entry, persists the result, and notifies on a new
 *  competitor winner. Returns false when the channel could not be fetched. */
export async function checkWatchEntry(
  email: string,
  entry: WatchEntry
): Promise<boolean> {
  const result = await fetchYouTube(entry.handle);
  if ("error" in result) return false;

  const report = runAudit("youtube", result.label, result.posts);
  const top = report.top.slice(0, 3).map((t) => t.title);

  // A new #1 on a channel we've seen before is the signal worth interrupting for.
  let prevTop: string[] = [];
  try {
    prevTop = entry.lastTop ? (JSON.parse(entry.lastTop) as string[]) : [];
  } catch {
    /* treat unparseable history as empty */
  }
  if (prevTop.length && top[0] && !prevTop.includes(top[0])) {
    insertNotification(email, {
      id: `n-${crypto.randomUUID()}`,
      title: "Competitor Breakout",
      message: `${report.label} has a new top video: "${top[0]}". Their winning patterns are already feeding your generation exemplars — worth a look at the hook.`,
      time: "Just now",
      read: false,
      type: "info",
    });
  }

  updateWatchResult(email, entry.id, { label: report.label, grade: report.grade, top });
  return true;
}

/** The niche swipe file: proven top titles across every watched channel,
 *  merged into generation exemplars alongside the creator's own winners. */
export function watchExemplars(email: string, limit = 3): string[] {
  const titles: string[] = [];
  for (const entry of listWatchlist(email)) {
    try {
      const top = entry.lastTop ? (JSON.parse(entry.lastTop) as string[]) : [];
      if (top[0]) titles.push(top[0]);
    } catch {
      /* skip unparseable rows */
    }
  }
  return titles.slice(0, limit);
}
