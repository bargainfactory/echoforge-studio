import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { insertIdea, listIdeas } from "@/lib/server/db";
import { scoreHook } from "@/lib/server/generate";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const MAX_TITLE = 200;
const MAX_NOTES = 2000;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ideas: listIdeas(user.email) });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = rateLimit(`ideas:${user.email}`, 60, 10 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
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
  const title = String(b?.title ?? "").trim().slice(0, MAX_TITLE);
  const notes = String(b?.notes ?? "").trim().slice(0, MAX_NOTES);
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const idea = insertIdea(user.email, {
    id: `idea-${crypto.randomUUID()}`,
    title,
    notes,
    script: "",
    score: scoreHook(title),
    status: "idea",
  });
  return NextResponse.json({ idea }, { status: 201 });
}
