import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRealSessionUser, ACTING_COOKIE } from "@/lib/server/auth";
import { hashPassword } from "@/lib/auth/session";
import {
  createUser,
  deleteManagedLink,
  findUser,
  insertManagedLink,
  insertNotification,
  listClientsOf,
  listManagersOf,
} from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

// How many client accounts each plan may manage.
const CLIENT_LIMITS: Record<string, number> = { Agency: 10, "Creator Pro": 2 };

/** Both sides of the delegation picture, always from the REAL identity. */
export async function GET() {
  const user = await getRealSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const store = await cookies();
  return NextResponse.json({
    clients: listClientsOf(user.email),
    managers: listManagersOf(user.email),
    acting: store.get(ACTING_COOKIE)?.value ?? null,
    limit: CLIENT_LIMITS[findUser(user.email)?.plan ?? ""] ?? 0,
  });
}

/** Invite (or create) a client account to manage. */
export async function POST(req: NextRequest) {
  const user = await getRealSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = rateLimit(`clients:${user.email}`, 10, 60 * 60 * 1000);
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
  const email = String((body as Record<string, unknown>)?.email ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@") || email === user.email.toLowerCase()) {
    return NextResponse.json({ error: "Enter a client's email address" }, { status: 400 });
  }

  const limit = CLIENT_LIMITS[findUser(user.email)?.plan ?? ""] ?? 0;
  if (limit === 0) {
    return NextResponse.json(
      { error: "Managing client accounts needs Creator Pro (2 clients) or Agency (10)" },
      { status: 402 }
    );
  }
  if (listClientsOf(user.email).length >= limit) {
    return NextResponse.json(
      { error: `Your plan manages up to ${limit} clients — remove one first` },
      { status: 422 }
    );
  }

  const existing = findUser(email);
  if (existing) {
    // Existing account: the client must approve before you can act as them.
    insertManagedLink(user.email, email, "invited");
    insertNotification(email, {
      id: `n-${crypto.randomUUID()}`,
      title: "Account Management Request",
      message: `${user.name} (${user.email}) wants to manage your Virafold account — generate, schedule, and publish on your behalf. Approve or decline in Settings → Client access.`,
      time: "Just now",
      read: false,
      type: "info",
    });
  } else {
    // New managed profile: created by the agency, active immediately. The
    // client can claim it any time via password reset on their email.
    const namePart = email.split("@")[0].replace(/[._-]+/g, " ");
    createUser({
      email,
      name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
      passwordHash: await hashPassword(crypto.randomUUID() + crypto.randomUUID()),
      plan: "Free",
      createdAt: new Date().toISOString(),
    });
    insertManagedLink(user.email, email, "active");
  }

  return NextResponse.json({
    clients: listClientsOf(user.email),
    created: !existing,
  });
}

/** Unlink a client/manager relationship — either side may sever it. */
export async function DELETE(req: NextRequest) {
  const user = await getRealSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const email = String((body as Record<string, unknown>)?.email ?? "")
    .trim()
    .toLowerCase();
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  deleteManagedLink(user.email, email);
  return NextResponse.json({
    clients: listClientsOf(user.email),
    managers: listManagersOf(user.email),
  });
}
