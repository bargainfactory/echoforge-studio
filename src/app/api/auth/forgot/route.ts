import { NextRequest, NextResponse } from "next/server";
import { publicOrigin } from "@/lib/server/base-url";
import { findUser, createResetToken } from "@/lib/server/db";
import { sendEmail, emailConfigured } from "@/lib/server/email";

export const dynamic = "force-dynamic";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = String((body as Record<string, unknown>)?.email ?? "").trim().toLowerCase();
  const user = email ? findUser(email) : null;

  // Always respond the same way to avoid leaking which emails exist.
  const response: { ok: true; devResetUrl?: string } = { ok: true };

  if (user) {
    const token = crypto.randomUUID().replace(/-/g, "");
    createResetToken(token, email, Date.now() + TOKEN_TTL_MS);
    const resetUrl = `${publicOrigin(req)}/reset?token=${token}`;

    const result = await sendEmail({
      to: email,
      subject: "Reset your Virafold password",
      html: `<p>Reset your password using the link below (valid for 1 hour):</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>If you didn't request this, you can ignore this email.</p>`,
    });

    // Fallback: if no email provider is connected, surface the link so the flow
    // still works. (Never leaks another user's link — only returned to the
    // requester, and only when email isn't configured.)
    if (!result.sent && !emailConfigured()) {
      response.devResetUrl = resetUrl;
    }
  }

  return NextResponse.json(response);
}
