import { NextResponse } from "next/server";
import { getSession, saveSession, type Profile } from "@/lib/session";
import { fail, publicState } from "@/lib/api";
import { track } from "@/lib/kwop";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Partial<Profile> | null;
  if (!body) return fail(400, "Invalid request.");
  const { lastPeriodStart, cycleLength, periodLength, weeklyRuns, level } = body;
  const start = typeof lastPeriodStart === "string" ? new Date(`${lastPeriodStart}T00:00:00`) : null;
  if (!start || Number.isNaN(start.getTime()) || start > new Date() || Date.now() - start.getTime() > 90 * 86_400_000)
    return fail(400, "Pick the first day of your last period (within the last 90 days).");
  if (!Number.isInteger(cycleLength) || cycleLength! < 21 || cycleLength! > 40) return fail(400, "Cycle length must be 21–40 days.");
  if (!Number.isInteger(periodLength) || periodLength! < 2 || periodLength! > 8) return fail(400, "Period length must be 2–8 days.");
  if (!Number.isInteger(weeklyRuns) || weeklyRuns! < 1 || weeklyRuns! > 7) return fail(400, "Runs per week must be 1–7.");
  if (level !== "new" && level !== "regular" && level !== "racer") return fail(400, "Pick your running level.");

  const s = await getSession();
  s.profile = { lastPeriodStart: lastPeriodStart!, cycleLength: cycleLength!, periodLength: periodLength!, weeklyRuns: weeklyRuns!, level };
  await saveSession(s);
  await track(s.userId, "onboarding_completed", { level });
  return NextResponse.json(publicState(s));
}
