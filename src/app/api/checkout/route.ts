import { NextRequest, NextResponse } from "next/server";

// Server-side allow-list of the plans/packages that may be checked out. A
// client-supplied priceId must match one of these before it is ever handed to
// Stripe — this blocks price tampering (e.g. checking out "agency" at the
// "free" price) and reflected-parameter abuse.
const ALLOWED_PRICE_IDS = new Set([
  "starter",
  "creatorPro",
  "agency",
]);

export async function POST(req: NextRequest) {
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

  // Stripe integration skeleton — replace with real Stripe SDK server-side.
  // The validated `priceId` above should be mapped to the real Stripe price via
  // an env-configured lookup before creating the session:
  //
  // import Stripe from 'stripe';
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const session = await stripe.checkout.sessions.create({
  //   mode: 'subscription',
  //   payment_method_types: ['card'],
  //   line_items: [{ price: STRIPE_PRICE_MAP[priceId], quantity: 1 }],
  //   success_url: `${req.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
  //   cancel_url: `${req.nextUrl.origin}/pricing`,
  // });
  // return NextResponse.json({ url: session.url });

  return NextResponse.json({
    url: `${req.nextUrl.origin}/dashboard?demo_checkout=${encodeURIComponent(priceId)}`,
    message: "Demo mode — connect your Stripe secret key to activate real payments.",
  });
}
