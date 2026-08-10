import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getPricingConfig } from "@/lib/server/db";
import { resolveField, isConfigured } from "@/lib/server/integrations";
import { rateLimit, clientIp } from "@/lib/server/rate-limit";

// Server-side allow-list of the plans/packages that may be checked out. A
// client-supplied priceId must match one of these before it is ever handed to
// Stripe — this blocks price tampering and reflected-parameter abuse.
const ALLOWED_PRICE_IDS = new Set(["lite", "starter", "creatorPro", "agency"]);

function form(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

export async function POST(req: NextRequest) {
  // This endpoint is unauthenticated (checkout can precede signup) and creates
  // Stripe sessions, so throttle per-IP to prevent session-creation spam.
  const gate = rateLimit(`checkout:${clientIp(req)}`, 10, 10 * 60 * 1000);
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

  const priceId = String((body as Record<string, unknown>)?.priceId ?? "");
  if (!ALLOWED_PRICE_IDS.has(priceId)) {
    return NextResponse.json({ error: "Unknown priceId" }, { status: 400 });
  }

  // Real Stripe when a secret key is connected; otherwise demo mode.
  if (isConfigured("stripe")) {
    const secret = resolveField("stripe", "secretKey")!;
    const plan = getPricingConfig().plans.find((p) => p.priceId === priceId);
    const amount = typeof plan?.price === "number" ? plan.price : 0;
    if (amount <= 0) {
      return NextResponse.json({ error: "Plan is not purchasable" }, { status: 400 });
    }
    try {
      // metadata.priceId is what lets the webhook attribute a completed
      // session back to a plan; customer_email pre-fills for signed-in buyers
      // and guarantees the webhook knows which account (or future account,
      // via pending_plans) the purchase belongs to.
      const sessionUser = await getSessionUser();
      const params: Record<string, string> = {
        mode: "subscription",
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)),
        "line_items[0][price_data][recurring][interval]": "month",
        "line_items[0][price_data][product_data][name]": `EchoForge ${priceId}`,
        "metadata[priceId]": priceId,
        "subscription_data[metadata][priceId]": priceId,
        client_reference_id: priceId,
        success_url: `${req.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.nextUrl.origin}/pricing`,
      };
      if (sessionUser) params.customer_email = sessionUser.email;
      const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form(params),
      });
      const data = await resp.json();
      if (resp.ok && data.url) {
        return NextResponse.json({ url: data.url });
      }
      // fall through to demo on Stripe error
    } catch {
      /* fall through to demo */
    }
  }

  return NextResponse.json({
    url: `${req.nextUrl.origin}/dashboard?demo_checkout=${encodeURIComponent(priceId)}`,
    message: "Demo mode — connect Stripe in Settings → Integrations to accept real payments.",
  });
}
