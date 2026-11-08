"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/components/useAccount";
import { PHASES, type Phase } from "@/lib/cycle";

type RunDay = { date: string; weekday: string; cycleDay: number; phase: Phase; session: string; minutes: number; intensity: number; effort: string; note: string };
type Training =
  | { needsProfile: true }
  | {
      needsProfile?: false;
      plan: "free" | "pro";
      phase: Phase;
      cycleDay: number;
      phaseLabel: string;
      blurb: string;
      today?: RunDay;
      week?: RunDay[];
      usage?: { used: number; limit: number; left: number };
    };

export default function Train() {
  const [data, setData] = useState<Training | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setError(null);
    setData(null);
    api<Training>("/api/training").then(setData).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error)
    return (
      <div className="container page center stack" style={{ maxWidth: 460 }}>
        <div className="alert alert-error" role="alert">
          {error}
        </div>
        <button className="btn btn-ghost" onClick={load}>
          Try again
        </button>
      </div>
    );

  if (!data)
    return (
      <div className="container page stack" aria-busy="true" aria-label="Loading your training">
        <div className="skeleton" style={{ height: 180, borderRadius: "var(--radius-lg)" }} />
        <div className="skeleton" style={{ height: 24, width: 200 }} />
        <div className="skeleton" style={{ height: 300, borderRadius: "var(--radius-lg)" }} />
      </div>
    );

  if (data.needsProfile)
    return (
      <div className="container page" data-testid="train-empty">
        <div className="card center stack" style={{ maxWidth: 460, margin: "0 auto" }}>
          <div style={{ fontSize: 40 }} aria-hidden>
            🗓️
          </div>
          <h1 className="h2">No cycle data yet</h1>
          <p className="muted">Answer three quick questions and we&apos;ll map your phases and build your runs.</p>
          <Link href="/onboarding" className="btn btn-primary btn-block">
            Set up my cycle <span className="arrow">→</span>
          </Link>
        </div>
      </div>
    );

  const pro = data.plan === "pro" && data.today && data.week;
  return (
    <div className="container page stack" data-testid={pro ? "train-pro" : "train-free"}>
      <section className={`card phase-${data.phase} phase-hero stack-sm fade-in`}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="eyebrow">Today · cycle day {data.cycleDay}</span>
          {pro ? <span className="badge badge-pink">👑 Pro</span> : <span className="badge">Free</span>}
        </div>
        <h1 className="h2">
          {PHASES[data.phase].emoji} {data.phaseLabel} phase
        </h1>
        <p className="muted">{data.blurb}</p>
      </section>

      {pro ? (
        <>
          <section className="card stack fade-in" data-testid="today-run">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 className="h3">Today&apos;s adjusted run</h2>
              <span className="muted small">{data.today!.effort}</span>
            </div>
            <div className="row" style={{ gap: "var(--s-5)" }}>
              <div>
                <div className="h2">{data.today!.session}</div>
                <div className="muted">{data.today!.minutes ? `${data.today!.minutes} min` : "Recovery"}</div>
              </div>
            </div>
            <div className="stack-sm">
              <div className="row small" style={{ justifyContent: "space-between" }}>
                <span>Intensity vs. your normal load</span>
                <b>{data.today!.intensity}%</b>
              </div>
              <div className="meter">
                <span style={{ width: `${Math.min(100, (data.today!.intensity / 110) * 100)}%` }} />
              </div>
            </div>
            <p className="small">💡 {data.today!.note}</p>
          </section>

          <section className="stack-sm">
            <h2 className="h3">Your next 7 days</h2>
            <div className="week">
              {data.week!.map((d) => (
                <div key={d.date} className={`day phase-${d.phase}`}>
                  <div style={{ minWidth: 48 }}>
                    <b>{d.weekday}</b>
                    <div className="muted small">Day {d.cycleDay}</div>
                  </div>
                  <div className="stack-sm" style={{ gap: 2 }}>
                    <span style={{ fontWeight: 600 }}>{d.session}</span>
                    <span className="muted small">{d.minutes ? `${d.minutes} min · ${d.intensity}%` : "Recovery"}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          {data.usage && (
            <p className="muted small">
              Plan refreshes this month: {data.usage.used} of {data.usage.limit}
            </p>
          )}
        </>
      ) : (
        <section className="card locked" data-testid="locked">
          <div className="locked-blur stack" aria-hidden>
            <h2 className="h3">Today&apos;s adjusted run</h2>
            <div className="h2">Tempo run · 40 min</div>
            <div className="meter">
              <span style={{ width: "80%" }} />
            </div>
            <div className="week">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className={`day phase-${data.phase}`} style={{ minHeight: 60 }}>
                  ···
                </div>
              ))}
            </div>
          </div>
          <div className="locked-cta">
            <span className="badge badge-pink">👑 Pro</span>
            <h2 className="h3">Unlock runs tuned to your {data.phaseLabel.toLowerCase()} phase</h2>
            <Link href="/pricing" className="btn btn-primary">
              See PacePrincess AI Pro <span className="arrow">→</span>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
