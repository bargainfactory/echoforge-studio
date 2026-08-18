import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { insertGenImage } from "@/lib/server/db";
import { generateThumbnail } from "@/lib/server/images";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/** Generate a thumbnail / cover image: AI background + title text overlay. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Image generation is a paid call.
  const gate = rateLimit(`img:${user.email}`, 10, 60 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const title = String(b?.title ?? "").trim().slice(0, 120);
  const topic = String(b?.topic ?? title).trim().slice(0, 300);
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const result = await generateThumbnail(id, topic, title);
  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }
  insertGenImage(user.email, id, topic, (result as { path: string }).path);
  return NextResponse.json({ id }, { status: 201 });
}
