import { NextRequest, NextResponse } from "next/server";
import { consumeResetToken, updateUserPassword } from "@/lib/server/db";
import { hashPassword } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const token = String(b?.token ?? "");
  const password = String(b?.password ?? "");

  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );

  const email = consumeResetToken(token);
  if (!email) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  updateUserPassword(email, passwordHash);
  return NextResponse.json({ ok: true });
}
