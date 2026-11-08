import "server-only";
import { randomUUID } from "node:crypto";

/**
 * Kwop adapter: payments, plans and funnel events.
 *
 * The real Kwop API docs were not available when this was built, so every call
 * goes through this one file. KWOP_MODE=test (the default) runs a built-in test
 * processor that behaves like a card processor in test mode:
 *   4242 4242 4242 4242 -> success
 *   4000 0000 0000 0002 -> declined
 * Swap the bodies of these functions for real Kwop calls when the API keys arrive;
 * nothing else in the app needs to change.
 */

export const KWOP_MODE: "test" | "live" = process.env.KWOP_MODE === "live" ? "live" : "test";

export class KwopError extends Error {
  constructor(message: string, public code: "card_declined" | "invalid_card" | "not_configured" | "bad_request") {
    super(message);
  }
}

function assertTestMode() {
  if (KWOP_MODE !== "test") {
    throw new KwopError("Kwop live mode is not wired up yet (see CLAUDE.md).", "not_configured");
  }
}

export type CheckoutSession = { id: string; planId: string; amountCents: number; currency: string };

export async function createCheckout(planId: string, amountCents: number, currency: string): Promise<CheckoutSession> {
  assertTestMode();
  return { id: `cs_test_${randomUUID()}`, planId, amountCents, currency };
}

export type CardInput = { number: string; exp: string; cvc: string; name: string };

function luhn(num: string) {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

/** Pays the checkout and starts the monthly subscription. Card data is never stored or logged. */
export async function confirmCheckout(checkoutId: string, card: CardInput) {
  assertTestMode();
  if (!checkoutId.startsWith("cs_test_")) throw new KwopError("Unknown checkout.", "bad_request");
  const number = card.number.replace(/\s+/g, "");
  const exp = /^(\d{2})\s*\/\s*(\d{2})$/.exec(card.exp.trim());
  if (!/^\d{13,19}$/.test(number) || !luhn(number)) throw new KwopError("That card number doesn't look right.", "invalid_card");
  if (!exp || Number(exp[1]) < 1 || Number(exp[1]) > 12) throw new KwopError("Use MM / YY for the expiry date.", "invalid_card");
  const expEnd = new Date(2000 + Number(exp[2]), Number(exp[1]), 1);
  if (expEnd <= new Date()) throw new KwopError("This card has expired.", "invalid_card");
  if (!/^\d{3,4}$/.test(card.cvc.trim())) throw new KwopError("The security code is 3 or 4 digits.", "invalid_card");
  if (!card.name.trim()) throw new KwopError("Add the name on the card.", "invalid_card");
  if (number === "4000000000000002") throw new KwopError("Your card was declined. Try another card.", "card_declined");

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  return {
    subscriptionId: `sub_test_${randomUUID()}`,
    startedAt: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    last4: number.slice(-4),
  };
}

export async function cancelSubscription(subscriptionId: string) {
  assertTestMode();
  return { id: subscriptionId, cancelAtPeriodEnd: true };
}

export async function resumeSubscription(subscriptionId: string) {
  assertTestMode();
  return { id: subscriptionId, cancelAtPeriodEnd: false };
}

/** Funnel / usage events. Never throws: tracking must not break the product. */
export async function track(userId: string, event: string, props: Record<string, unknown> = {}) {
  try {
    if (KWOP_MODE === "test") {
      if (process.env.NODE_ENV !== "production") console.info("[kwop:event]", event, JSON.stringify(props));
      return;
    }
  } catch {
    /* ignore */
  }
  void userId;
}
