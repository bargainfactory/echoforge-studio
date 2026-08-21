import { NextResponse } from "next/server";
import fs from "node:fs";
import { getDb } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Liveness for external uptime monitors: DB reachable, disk not full.
 *  200 = healthy, 503 = page someone. Public and cheap by design. */
export async function GET() {
  let dbOk = false;
  try {
    getDb().prepare("SELECT 1").get();
    dbOk = true;
  } catch {
    dbOk = false;
  }

  let diskFreeMb: number | null = null;
  try {
    const s = fs.statfsSync(process.cwd());
    diskFreeMb = Math.round((s.bavail * s.bsize) / (1024 * 1024));
  } catch {
    /* statfs unavailable on some platforms — not a failure */
  }

  const diskOk = diskFreeMb === null || diskFreeMb > 500;
  const ok = dbOk && diskOk;
  return NextResponse.json(
    { ok, db: dbOk, diskFreeMb, uptimeSec: Math.round(process.uptime()) },
    { status: ok ? 200 : 503 }
  );
}
