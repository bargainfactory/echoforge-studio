import { resolveField, isConfigured } from "./integrations";

/**
 * Sends email via Resend when configured. Returns { sent:false } (not an error)
 * when no email provider is connected, so callers can fall back gracefully
 * (e.g. surface a reset link in the UI) instead of failing.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!isConfigured("email")) return { sent: false };
  const key = resolveField("email", "resendApiKey");
  const from = resolveField("email", "fromEmail");
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    if (!resp.ok) return { sent: false, error: await resp.text() };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: String(e) };
  }
}

export function emailConfigured(): boolean {
  return isConfigured("email");
}
