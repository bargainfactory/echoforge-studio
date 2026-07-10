import { loadStripe } from "@stripe/stripe-js";

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
}

export const PRICE_IDS = {
  lite: process.env.NEXT_PUBLIC_STRIPE_LITE_PRICE_ID || "price_lite",
  starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || "price_starter",
  creatorPro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_pro",
  agency: process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID || "price_agency",
} as const;

export async function createCheckoutSession(priceId: string) {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  });
  const { url } = await response.json();
  if (url) {
    window.location.href = url;
  }
}
