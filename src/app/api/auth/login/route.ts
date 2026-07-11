import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  initialsFor,
  verifyPassword,
} from "@/lib/auth/session";
import { findUser } from "@/lib/server/db";
import { rateLimit, clientIp } from "@/lib/server/rate-limit";

export async function POST(req: NextRequest) {
  const gate = rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
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
  const email = String(b?.email ?? "").trim().toLowerCase();
  const password = String(b?.password ?? "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = findUser(email);
  // Verify against the stored hash. When the account is unknown we still run a
  // throwaway comparison-free path but return the same generic error to avoid
  // leaking which emails exist.
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const sessionUser = {
    name: user.name,
    email: user.email,
    initials: initialsFor(user.name),
    plan: user.plan,
  };
  const token = await createSessionToken(sessionUser);

  const res = NextResponse.json({ user: sessionUser });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
