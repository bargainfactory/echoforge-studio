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
  insertNotification,
  listAllScheduledPending,
  setScheduledStatus,
} from "./db";

const TICK_MS = 60 * 1000;

declare global {
  // Survives Next.js dev-mode module reloads so only one interval ever runs.
  var __echoforgeSchedulerStarted: boolean | undefined;
}

export function publishDuePosts(): number {
  const now = Date.now();
  let published = 0;
  for (const post of listAllScheduledPending()) {
    const due = new Date(post.scheduledAt).getTime();
    if (Number.isNaN(due) || due > now) continue;
    setScheduledStatus(post.userEmail, post.id, "published");
    insertNotification(post.userEmail, {
      id: `n-${crypto.randomUUID()}`,
      title: "Scheduled Post Published",
      message: `"${post.assetName}" went out to ${post.platform} as scheduled.`,
      time: "Just now",
      read: false,
      type: "success",
    });
    published++;
  }
  return published;
}

export function startScheduler(): void {
  if (globalThis.__echoforgeSchedulerStarted) return;
  globalThis.__echoforgeSchedulerStarted = true;
  const timer = setInterval(() => {
    try {
      publishDuePosts();
    } catch {
      /* a bad tick must never kill the interval */
    }
  }, TICK_MS);
  // Never hold the process open (build workers, scripts, graceful shutdown).
  timer.unref?.();
}
