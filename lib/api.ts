import "server-only";
import { NextResponse } from "next/server";
import { getPlan, usageLeft } from "./plan";
import { PRO_PLAN } from "./plans";
import type { Session } from "./session";

export function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/** What the client may know about the account. Never includes secrets. */
export function publicState(s: Session) {
  const plan = getPlan(s);
  return {
    plan,
    profile: s.profile ?? null,
    subscription: s.subscription
      ? {
          planName: PRO_PLAN.name,
          priceCents: PRO_PLAN.priceCents,
          status: s.subscription.cancelAtPeriodEnd ? "canceling" : "active",
          startedAt: s.subscription.startedAt,
          currentPeriodEnd: s.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: s.subscription.cancelAtPeriodEnd,
          last4: s.subscription.last4,
          active: plan === "pro",
        }
      : null,
    usage: plan === "pro" ? usageLeft(s) : null,
  };
}
