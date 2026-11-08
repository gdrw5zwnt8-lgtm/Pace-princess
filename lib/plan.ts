import "server-only";
import { PRO_PLAN, type PlanKey } from "./plans";
import type { Session } from "./session";

/** The ONLY place that decides what a user has paid for. Always call on the server. */
export function getPlan(s: Session, now = new Date()): PlanKey {
  const sub = s.subscription;
  if (!sub || sub.planId !== PRO_PLAN.kwopPlanId) return "free";
  // A canceled subscription keeps access until the end of the paid period.
  return new Date(sub.currentPeriodEnd) > now ? "pro" : "free";
}

function period(now: Date) {
  return now.toISOString().slice(0, 7);
}

export function usageLeft(s: Session, now = new Date()) {
  const used = s.usage?.period === period(now) ? s.usage.count : 0;
  return { used, limit: PRO_PLAN.quota, left: Math.max(0, PRO_PLAN.quota - used) };
}

/** Count one use against the plan quota. Returns false when the quota is spent. */
export function consumeQuota(s: Session, now = new Date()): boolean {
  const { used } = usageLeft(s, now);
  if (used >= PRO_PLAN.quota) return false;
  s.usage = { period: period(now), count: used + 1 };
  return true;
}
