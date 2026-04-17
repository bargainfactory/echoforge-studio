import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { priceId } = await req.json();

  // Stripe integration skeleton — replace with real Stripe SDK server-side:
  //
  // import Stripe from 'stripe';
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const session = await stripe.checkout.sessions.create({
  //   mode: 'subscription',
  //   payment_method_types: ['card'],
  //   line_items: [{ price: priceId, quantity: 1 }],
  //   success_url: `${req.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
  //   cancel_url: `${req.nextUrl.origin}/pricing`,
  // });
  // return NextResponse.json({ url: session.url });

  return NextResponse.json({
    url: `${req.nextUrl.origin}/dashboard?demo_checkout=${priceId}`,
    message: "Demo mode — connect your Stripe secret key to activate real payments.",
  });
}
