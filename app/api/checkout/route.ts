import { NextResponse } from "next/server";
import { getSession, saveSession } from "@/lib/session";
import { getPlan } from "@/lib/plan";
import { PRO_PLAN } from "@/lib/plans";
import { createCheckout, KwopError, KWOP_MODE, track } from "@/lib/kwop";
import { fail } from "@/lib/api";

/** Step 1 of the in-page checkout: open a Kwop checkout session for Pro. */
export async function POST() {
  const s = await getSession();
  if (getPlan(s) === "pro") return fail(409, "You already have PacePrincess AI Pro.");
  try {
    const cs = await createCheckout(PRO_PLAN.kwopPlanId, PRO_PLAN.priceCents, PRO_PLAN.currency);
    s.pendingCheckout = { id: cs.id, planId: cs.planId, createdAt: new Date().toISOString() };
    await saveSession(s);
    await track(s.userId, "checkout_started", { plan: PRO_PLAN.kwopPlanId });
    return NextResponse.json({ checkoutId: cs.id, amountCents: cs.amountCents, currency: cs.currency, planName: PRO_PLAN.name, testMode: KWOP_MODE === "test" });
  } catch (e) {
    return fail(e instanceof KwopError && e.code === "not_configured" ? 503 : 500, e instanceof Error ? e.message : "Checkout failed.");
  }
}
