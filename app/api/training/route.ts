import { NextResponse } from "next/server";
import { getSession, saveSession } from "@/lib/session";
import { consumeQuota, getPlan, usageLeft } from "@/lib/plan";
import { coach } from "@/lib/ai";
import { track } from "@/lib/kwop";
import { fail } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Cycle-synced training. Paid part (adjusted runs + week) is gated here, on the server. */
export async function GET() {
  const s = await getSession();
  if (!s.profile) return NextResponse.json({ needsProfile: true });
  const plan = getPlan(s);
  if (plan !== "pro") return NextResponse.json({ plan, ...coach(s.profile, new Date(), false) });

  if (!consumeQuota(s)) return fail(429, "You've used this month's plan refreshes. They reset on the 1st.");
  await saveSession(s);
  await track(s.userId, "feature_used", { detail: "Cycle-Synced Training" });
  return NextResponse.json({ plan, usage: usageLeft(s), ...coach(s.profile, new Date(), true) });
}
