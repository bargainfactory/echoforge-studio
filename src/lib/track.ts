/**
 * Lightweight funnel tracking. Fires a fire-and-forget event to /api/track via
 * sendBeacon (falls back to keepalive fetch). Safe to call anywhere client-side.
 */
export function track(event: string, meta?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ event, path: window.location.pathname, meta });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", body);
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* never block the UI on tracking */
  }
}
