/**
 * In-process scheduler: delivers due scheduled posts without anyone clicking
 * "Publish now". Started once per server via instrumentation.ts.
 *
 * Scheduled times come from a datetime-local input and are stored without a
 * timezone, so they are interpreted in the server's local time — acceptable
 * for a single-server deployment, and the tick is coarse (once a minute) by
 * design. Real platform delivery still depends on a connected publishing app;
 * without one this performs the same demo-mode publish as the manual button.
 */

import {
  createScheduledPost,
  getAsset,
  insertNotification,
  listAllScheduledPending,
  setScheduledStatus,
} from "./db";
import { deliverPost } from "./connect";

const TICK_MS = 60 * 1000;
// Evergreen assets are re-queued this long after each automatic publish.
const RECYCLE_DAYS = 14;

function toLocalStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

declare global {
  // Survives Next.js dev-mode module reloads so only one interval ever runs.
  var __virafoldSchedulerStarted: boolean | undefined;
}

export async function publishDuePosts(): Promise<number> {
  const now = Date.now();
  let published = 0;
  for (const post of listAllScheduledPending()) {
    const due = new Date(post.scheduledAt).getTime();
    if (Number.isNaN(due) || due > now) continue;

    // Real delivery when the creator has connected this platform; demo-mode
    // publish (status only) otherwise — same contract as the manual button.
    const asset = getAsset(post.userEmail, post.assetId);
    let deliveryNote = "";
    if (asset?.content) {
      const result = await deliverPost(post.userEmail, post.platform, asset.content);
      if (result) {
        deliveryNote = result.ok
          ? ` Delivered to your connected account (${result.detail}).`
          : ` Delivery to your connected account failed (${result.detail}) — marked published locally.`;
      }
    }

    setScheduledStatus(post.userEmail, post.id, "published");
    insertNotification(post.userEmail, {
      id: `n-${crypto.randomUUID()}`,
      title: "Scheduled Post Published",
      message: `"${post.assetName}" went out to ${post.platform} as scheduled.${deliveryNote}`,
      time: "Just now",
      read: false,
      type: "success",
    });
    published++;

    // Evergreen recycling: top content goes back in the queue automatically.
    if (asset?.evergreen) {
      const next = new Date(now + RECYCLE_DAYS * 24 * 60 * 60 * 1000);
      createScheduledPost(post.userEmail, {
        id: `sch-${crypto.randomUUID()}`,
        assetId: post.assetId,
        assetName: post.assetName,
        platform: post.platform,
        scheduledAt: toLocalStamp(next),
        status: "scheduled",
      });
      insertNotification(post.userEmail, {
        id: `n-${crypto.randomUUID()}`,
        title: "Evergreen Re-queued",
        message: `"${post.assetName}" is evergreen — scheduled again for ${post.platform} in ${RECYCLE_DAYS} days.`,
        time: "Just now",
        read: false,
        type: "info",
      });
    }
  }
  return published;
}

export function startScheduler(): void {
  if (globalThis.__virafoldSchedulerStarted) return;
  globalThis.__virafoldSchedulerStarted = true;
  const timer = setInterval(() => {
    publishDuePosts().catch(() => {
      /* a bad tick must never kill the interval */
    });
  }, TICK_MS);
  // Never hold the process open (build workers, scripts, graceful shutdown).
  timer.unref?.();
}
