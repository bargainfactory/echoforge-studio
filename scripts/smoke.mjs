/**
 * Post-build smoke test: boots the production server on a scratch port and
 * exercises the critical paths end-to-end (landing, health, deterministic
 * tools, signup → session → bootstrap). Runs keyless — anything that needs a
 * provider key only has to fail CLEANLY (JSON error, not a 500 crash).
 */
import { spawn } from "node:child_process";

const PORT = 3199;
const BASE = `http://127.0.0.1:${PORT}`;
const isWin = process.platform === "win32";

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function waitForServer(timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(BASE, { redirect: "manual" });
      if (r.status < 600) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

const child = spawn(isWin ? "npx.cmd" : "npx", ["next", "start", "-p", String(PORT)], {
  stdio: ["ignore", "pipe", "pipe"],
  shell: isWin,
  env: {
    ...process.env,
    PORT: String(PORT),
    // Session signing needs a secret under `next start`; smoke runs are
    // throwaway, so a fixed test secret is fine when none is provided.
    SESSION_SECRET: process.env.SESSION_SECRET ?? "smoke-only-secret-0123456789",
  },
});
let serverLog = "";
child.stdout?.on("data", (d) => (serverLog += String(d)));
child.stderr?.on("data", (d) => (serverLog += String(d)));

try {
  if (!(await waitForServer())) {
    console.error("Server never came up. Log tail:\n" + serverLog.slice(-2000));
    process.exit(1);
  }

  // 1. Landing renders real content
  const home = await fetch(BASE);
  const homeText = await home.text();
  check("GET / renders", home.ok && homeText.includes("Virafold"));

  // 2. Health endpoint
  const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
  check("GET /api/health ok", health.ok === true, JSON.stringify(health));

  // 3. Deterministic tool (no provider keys involved)
  const hook = await fetch(`${BASE}/api/tools/hook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "I tried 30 days of cold showers and this happened" }),
  });
  const hookData = await hook.json().catch(() => null);
  check("POST /api/tools/hook scores", hook.ok && typeof hookData?.score === "number");

  // 4. Anonymous generator: succeeds with keys, fails cleanly without
  const tryRes = await fetch(`${BASE}/api/try`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: "A short note about morning routines and focus.", format: "thread" }),
  });
  const tryData = await tryRes.json().catch(() => null);
  check(
    "POST /api/try responds cleanly",
    tryRes.status < 500 || Boolean(tryData?.error),
    `status ${tryRes.status}`
  );

  // 5. Signup → session cookie → bootstrap round-trip
  const email = `smoke-${Date.now()}@example.com`;
  const signup = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Smoke Test", email, password: "smoketest123" }),
  });
  const cookie = signup.headers.get("set-cookie")?.split(";")[0] ?? "";
  check("POST /api/auth/signup sets session", signup.ok && cookie.length > 0);

  const boot = await fetch(`${BASE}/api/bootstrap`, { headers: { cookie } });
  const bootData = await boot.json().catch(() => null);
  check(
    "GET /api/bootstrap returns account",
    boot.ok && Array.isArray(bootData?.projects) && bootData?.user?.email === email
  );

  console.log(failures === 0 ? "\nSMOKE OK" : `\nSMOKE FAILED (${failures})`);
  process.exitCode = failures === 0 ? 0 : 1;
} finally {
  if (isWin) {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { shell: true });
  } else {
    child.kill("SIGTERM");
  }
}
