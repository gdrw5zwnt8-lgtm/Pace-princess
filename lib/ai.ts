import "server-only";
import { cycleDay, phaseFor, PHASES, type Phase } from "./cycle";
import type { Profile } from "./session";

/**
 * All "AI" in PacePrincess goes through this file.
 * Today it is a deterministic coaching engine based on published cycle-phase
 * training guidance (no model calls, no keys, same input -> same plan).
 * A model call can replace `coach()` later without touching any caller.
 */

export type RunDay = {
  date: string; // YYYY-MM-DD
  weekday: string;
  cycleDay: number;
  phase: Phase;
  session: string;
  minutes: number;
  intensity: number; // % of normal training load
  effort: string;
  note: string;
};

const BY_PHASE: Record<Phase, { intensity: number; sessions: string[]; effort: string; note: string }> = {
  menstrual: {
    intensity: 70,
    sessions: ["Easy run", "Walk-run + mobility", "Rest or yoga"],
    effort: "Zone 1–2 · conversational",
    note: "Iron-rich food and an extra 30 min of sleep help.",
  },
  follicular: {
    intensity: 100,
    sessions: ["Tempo run", "Long run", "Hill repeats", "Progression run"],
    effort: "Zone 3–4 · comfortably hard",
    note: "Your body adapts fastest now. Build mileage here.",
  },
  ovulatory: {
    intensity: 110,
    sessions: ["Intervals 6×400 m", "Race-pace run", "Fartlek"],
    effort: "Zone 4–5 · fast",
    note: "Warm up longer: ligaments are looser this week.",
  },
  luteal: {
    intensity: 85,
    sessions: ["Steady run", "Easy run", "Long easy run", "Rest"],
    effort: "Zone 2–3 · steady",
    note: "Core temperature is higher: hydrate and add carbs.",
  },
};

const BASE_MINUTES: Record<Profile["level"], number> = { new: 25, regular: 40, racer: 55 };

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayPlan(p: Profile, date: Date, index: number): RunDay {
  const day = cycleDay(p.lastPeriodStart, p.cycleLength, date);
  const phase = phaseFor(day, p.cycleLength, p.periodLength);
  const rule = BY_PHASE[phase];
  // Spread the weekly runs over 7 days; the other days are rest.
  const runDays = new Set(Array.from({ length: p.weeklyRuns }, (_, i) => Math.floor((i * 7) / p.weeklyRuns)));
  const rest = !runDays.has(index);
  const session = rest ? "Rest day" : rule.sessions[(day + index) % rule.sessions.length];
  const isRest = rest || session === "Rest" || session === "Rest or yoga";
  return {
    date: iso(date),
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    cycleDay: day,
    phase,
    session,
    minutes: isRest ? 0 : Math.round((BASE_MINUTES[p.level] * rule.intensity) / 100 / 5) * 5,
    intensity: isRest ? 0 : rule.intensity,
    effort: isRest ? "Recovery" : rule.effort,
    note: rule.note,
  };
}

/** Free: today's phase only. Pro: today's adjusted run + the next 7 days. */
export function coach(p: Profile, from: Date, full: boolean) {
  const today = dayPlan(p, from, 0);
  const info = PHASES[today.phase];
  if (!full) return { phase: today.phase, cycleDay: today.cycleDay, phaseLabel: info.label, blurb: info.blurb };
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    return dayPlan(p, d, i);
  });
  return { phase: today.phase, cycleDay: today.cycleDay, phaseLabel: info.label, blurb: info.blurb, today, week };
}
