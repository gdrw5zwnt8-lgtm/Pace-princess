import { NextResponse } from "next/server";
import { getSession, saveSession } from "@/lib/session";
import { cancelSubscription, resumeSubscription, track } from "@/lib/kwop";
import { fail, publicState } from "@/lib/api";
import { getPlan } from "@/lib/plan";

/** Manage the subscription from account settings: cancel (at period end) or resume. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { action?: string } | null;
  const s = await getSession();
  if (!s.subscription || getPlan(s) !== "pro") return fail(404, "No active subscription.");
  try {
    if (body?.action === "cancel") {
      await cancelSubscription(s.subscription.kwopSubscriptionId);
      s.subscription.cancelAtPeriodEnd = true;
      await track(s.userId, "subscription_canceled", {});
    } else if (body?.action === "resume") {
      await resumeSubscription(s.subscription.kwopSubscriptionId);
      s.subscription.cancelAtPeriodEnd = false;
      await track(s.userId, "subscription_resumed", {});
    } else {
      return fail(400, "Unknown action.");
    }
    await saveSession(s);
    return NextResponse.json(publicState(s));
  } catch (e) {
    return fail(500, e instanceof Error ? e.message : "Could not update your subscription.");
  }
}
