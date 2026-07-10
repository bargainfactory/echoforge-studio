import { NextRequest, NextResponse } from "next/server";
import { insertEvent } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Fire-and-forget funnel event ingestion (public). Accepts sendBeacon text or
 *  JSON. Never returns data — just a 204. */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const data = raw ? JSON.parse(raw) : {};
    const event = String(data?.event ?? "").trim();
    if (event) {
      const meta = data?.meta ? JSON.stringify(data.meta) : null;
      insertEvent(event, String(data?.path ?? ""), meta);
    }
  } catch {
    /* ignore malformed beacons */
  }
  return new NextResponse(null, { status: 204 });
}
