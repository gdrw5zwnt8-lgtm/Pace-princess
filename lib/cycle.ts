export type Phase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export const PHASES: Record<Phase, { label: string; emoji: string; blurb: string }> = {
  menstrual: { label: "Menstrual", emoji: "🌙", blurb: "Energy is lower. Easy miles and recovery." },
  follicular: { label: "Follicular", emoji: "🌱", blurb: "Energy rises. Your best window for building." },
  ovulatory: { label: "Ovulatory", emoji: "⚡", blurb: "Peak power. Go for speed and strength." },
  luteal: { label: "Luteal", emoji: "🍂", blurb: "Steady efforts. Fuel well, sleep more." },
};

function daysBetween(a: Date, b: Date) {
  const ms = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  return Math.round(ms / 86_400_000);
}

/** Day of cycle (1-based) on `date`, given the start of the last period. */
export function cycleDay(lastPeriodStart: string, cycleLength: number, date: Date) {
  const start = new Date(`${lastPeriodStart}T00:00:00`);
  const diff = daysBetween(start, date);
  return (((diff % cycleLength) + cycleLength) % cycleLength) + 1;
}

export function phaseFor(day: number, cycleLength: number, periodLength: number): Phase {
  const ovulation = cycleLength - 14;
  if (day <= periodLength) return "menstrual";
  if (day < ovulation - 1) return "follicular";
  if (day <= ovulation + 1) return "ovulatory";
  return "luteal";
}
