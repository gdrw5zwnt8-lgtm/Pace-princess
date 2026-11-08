import { NextResponse } from "next/server";
import { getSession, saveSession } from "@/lib/session";
import { PRO_PLAN } from "@/lib/plans";
import { confirmCheckout, KwopError, track, type CardInput } from "@/lib/kwop";
import { fail, publicState } from "@/lib/api";

/** Step 2: pay. On success the subscription is written and Pro unlocks immediately. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { checkoutId?: string; card?: Partial<CardInput> } | null;
  const s = await getSession();
  const pending = s.pendingCheckout;
  if (!body?.checkoutId || !pending || pending.id !== body.checkoutId) return fail(400, "This checkout expired. Please start again.");
  if (Date.now() - new Date(pending.createdAt).getTime() > 30 * 60_000) return fail(400, "This checkout expired. Please start again.");
  const card = body.card ?? {};
  try {
    const paid = await confirmCheckout(pending.id, {
      number: String(card.number ?? ""),
      exp: String(card.exp ?? ""),
      cvc: String(card.cvc ?? ""),
      name: String(card.name ?? ""),
    });
    s.subscription = {
      kwopSubscriptionId: paid.subscriptionId,
      planId: PRO_PLAN.kwopPlanId,
      status: "active",
      startedAt: paid.startedAt,
      currentPeriodEnd: paid.currentPeriodEnd,
      cancelAtPeriodEnd: false,
      last4: paid.last4,
    };
    delete s.pendingCheckout;
    await saveSession(s);
    await track(s.userId, "subscription_started", { plan: PRO_PLAN.kwopPlanId, amount: PRO_PLAN.priceCents });
    return NextResponse.json({ paid: true, ...publicState(s) });
  } catch (e) {
    // A declined or mistyped card is a normal outcome, not a server error: answer 200 with paid:false.
    if (e instanceof KwopError && (e.code === "card_declined" || e.code === "invalid_card"))
      return NextResponse.json({ paid: false, error: e.message, code: e.code });
    if (e instanceof KwopError) return fail(e.code === "not_configured" ? 503 : 400, e.message);
    return fail(500, "Payment failed. You were not charged.");
  }
}
