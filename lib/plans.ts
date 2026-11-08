// Single source of truth for what is sold. Prices in cents.
export type PlanKey = "free" | "pro";

export const PRO_PLAN = {
  key: "pro" as const,
  // Kwop plan id. Set KWOP_PRO_PLAN_ID once the plan exists in the Kwop dashboard.
  kwopPlanId: process.env.KWOP_PRO_PLAN_ID || "pp_pro_monthly",
  name: "PacePrincess AI Pro",
  priceCents: 1299,
  currency: "USD",
  interval: "month" as const,
  // Runs of the plan engine (lib/ai.ts) included per billing month.
  quota: 200,
  benefits: [
    "Daily run intensity tuned to your current cycle phase",
    "7-day cycle-synced training week, rebuilt every day",
    "Pace and effort-zone guidance for every phase",
    "Recovery and fuelling cues for luteal and period days",
    "Cancel anytime from your account",
  ],
};

export const FREE_PLAN = { key: "free" as const, name: "Free", quota: 0 };

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Price a day, the way the funnel shows it: monthly price * 12 / 365. */
export function pricePerDay(cents: number) {
  return `$${((cents * 12) / 365 / 100).toFixed(2)}`;
}
