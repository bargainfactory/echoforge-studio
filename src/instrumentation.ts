/**
 * Next.js instrumentation hooks — run once per server instance.
 * register() starts the background scheduler; onRequestError() captures every
 * unhandled route error into the error log the Operator Console reads, so
 * failures are visible instead of vanishing into journald.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("@/lib/server/scheduler");
    startScheduler();

    // Last-resort capture for errors outside the request lifecycle.
    const g = globalThis as { __virafoldProcHooks?: boolean };
    if (!g.__virafoldProcHooks) {
      g.__virafoldProcHooks = true;
      const log = async (context: string, err: unknown) => {
        try {
          const { insertErrorLog } = await import("@/lib/server/db");
          const e = err as Error;
          insertErrorLog(context, String(e?.message ?? err), e?.stack);
        } catch {
          /* never throw from the logger */
        }
      };
      process.on("uncaughtException", (err) => void log("process:uncaught", err));
      process.on("unhandledRejection", (err) => void log("process:rejection", err));
    }
  }
}

export async function onRequestError(
  err: unknown,
  request: { path?: string; url?: string; method?: string }
) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { insertErrorLog } = await import("@/lib/server/db");
    const e = err as Error;
    insertErrorLog(
      `${request?.method ?? "?"} ${request?.path ?? request?.url ?? "?"}`,
      String(e?.message ?? err),
      e?.stack
    );
  } catch {
    /* never throw from the logger */
  }
}
