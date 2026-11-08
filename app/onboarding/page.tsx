"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PricingCard } from "@/components/PricingCard";
import { api, useAccount, type Account } from "@/components/useAccount";
import { PHASES, cycleDay, phaseFor, type Phase } from "@/lib/cycle";

type Level = "new" | "regular" | "racer";

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Onboarding() {
  const { account, setAccount } = useAccount();
  const [step, setStep] = useState(0);
  const [today, setToday] = useState("");
  const [minDate, setMinDate] = useState("");
  const [form, setForm] = useState({ lastPeriodStart: "", cycleLength: 28, periodLength: 5, weeklyRuns: 3, level: "regular" as Level });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToday(isoDaysAgo(0));
    setMinDate(isoDaysAgo(90));
    setForm((f) => (f.lastPeriodStart ? f : { ...f, lastPeriodStart: isoDaysAgo(10) }));
  }, []);

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      const acc = await api<Account>("/api/profile", { method: "POST", body: JSON.stringify(form) });
      setAccount(acc);
      setStep(3);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const steps = 4;
  let phase: Phase = "follicular";
  let day = 1;
  if (form.lastPeriodStart) {
    day = cycleDay(form.lastPeriodStart, form.cycleLength, new Date());
    phase = phaseFor(day, form.cycleLength, form.periodLength);
  }

  return (
    <div className="container page">
      <div className="stack" style={{ maxWidth: step === 3 ? 520 : 460, margin: "0 auto" }}>
        <div className="progress" aria-label={`Step ${step + 1} of ${steps}`}>
          {Array.from({ length: steps }, (_, i) => (
            <span key={i} className={i <= step ? "on" : ""} />
          ))}
        </div>

        {step === 0 && (
          <div className="card stack fade-in" key="s0">
            <span className="eyebrow">Step 1 of 3</span>
            <h1 className="h2">When did your last period start?</h1>
            <p className="muted">The first day of bleeding. A best guess is fine; you can change it later.</p>
            <label className="field">
              <span className="label">First day of last period</span>
              <input
                type="date"
                className="input"
                value={form.lastPeriodStart}
                max={today}
                min={minDate}
                onChange={(e) => setForm({ ...form, lastPeriodStart: e.target.value })}
              />
            </label>
            <button className="btn btn-primary btn-block" disabled={!form.lastPeriodStart} onClick={() => setStep(1)}>
              Continue <span className="arrow">→</span>
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="card stack fade-in" key="s1">
            <span className="eyebrow">Step 2 of 3</span>
            <h1 className="h2">Your cycle</h1>
            <label className="field">
              <span className="label">Cycle length: {form.cycleLength} days</span>
              <input type="range" min={21} max={40} value={form.cycleLength} onChange={(e) => setForm({ ...form, cycleLength: Number(e.target.value) })} style={{ accentColor: "var(--pink-500)" }} />
            </label>
            <label className="field">
              <span className="label">Period length: {form.periodLength} days</span>
              <input type="range" min={2} max={8} value={form.periodLength} onChange={(e) => setForm({ ...form, periodLength: Number(e.target.value) })} style={{ accentColor: "var(--pink-500)" }} />
            </label>
            <p className="muted small">Not sure? 28 and 5 are the most common.</p>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>
                Back
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(2)}>
                Continue <span className="arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card stack fade-in" key="s2">
            <span className="eyebrow">Step 3 of 3</span>
            <h1 className="h2">How do you run?</h1>
            <div className="field">
              <span className="label">Runs per week</span>
              <div className="chips">
                {[2, 3, 4, 5, 6].map((n) => (
                  <button key={n} type="button" className="chip" aria-pressed={form.weeklyRuns === n} onClick={() => setForm({ ...form, weeklyRuns: n })}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="label">Level</span>
              <div className="chips">
                {([
                  ["new", "Just started"],
                  ["regular", "Regular runner"],
                  ["racer", "Racing"],
                ] as [Level, string][]).map(([v, l]) => (
                  <button key={v} type="button" className="chip" aria-pressed={form.level === v} onClick={() => setForm({ ...form, level: v })}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={saving}>
                Back
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={finish} disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner" aria-hidden /> Building your plan…
                  </>
                ) : (
                  <>
                    Build my plan <span className="arrow">→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="stack fade-in" key="s3">
            <div className={`card phase-${phase} phase-hero center stack-sm`} data-testid="phase-reveal">
              <span className="eyebrow">Your plan is ready</span>
              <div style={{ fontSize: 40 }} aria-hidden>
                {PHASES[phase].emoji}
              </div>
              <h1 className="h2">
                Day {day}: {PHASES[phase].label} phase
              </h1>
              <p className="muted">{PHASES[phase].blurb}</p>
            </div>
            <p className="center muted">Unlock today&apos;s adjusted run and your full cycle-synced week:</p>
            <PricingCard account={account} onPaid={setAccount} />
            <div className="center">
              <Link href="/train" className="link-btn">
                Continue with the free phase tracker
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
