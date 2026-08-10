/**
 * Next.js instrumentation hook — runs once when a server instance boots.
 * Starts the background scheduler that delivers due scheduled posts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("@/lib/server/scheduler");
    startScheduler();
  }
}
