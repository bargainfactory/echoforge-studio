import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getRealSessionUser, ACTING_COOKIE } from "@/lib/server/auth";
import { deleteAccount, insertAudit } from "@/lib/server/db";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Full account deletion — the counterpart to export. Explicit confirmation,
 * real identity only (never through acting-as), every row and file gone,
 * session ended. Irreversible by design.
 */
export async function DELETE(req: NextRequest) {
  const user = await getRealSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const confirm = String((body as Record<string, unknown>)?.confirm ?? "")
    .trim()
    .toLowerCase();
  if (confirm !== user.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Type your account email exactly to confirm deletion" },
      { status: 400 }
    );
  }

  const { files } = deleteAccount(user.email);
  for (const rel of files) {
    try {
      fs.rmSync(path.join(process.cwd(), rel), { force: true });
    } catch {
      /* the retention sweep collects any stragglers */
    }
  }
  insertAudit("system", "account.deleted", user.email);

  const res = NextResponse.json({ ok: true });
  const kill = { httpOnly: true, path: "/", maxAge: 0 };
  res.cookies.set(SESSION_COOKIE, "", kill);
  res.cookies.set(ACTING_COOKIE, "", kill);
  return res;
}
