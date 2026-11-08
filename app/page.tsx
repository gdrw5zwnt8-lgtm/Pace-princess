import Link from "next/link";
import { PHASES, type Phase } from "@/lib/cycle";

// Funnel rule: NO prices on the landing page. Price appears at the peak (end of onboarding).
export default function Landing() {
  const phases = Object.entries(PHASES) as [Phase, (typeof PHASES)[Phase]][];
  return (
    <div className="container page stack" style={{ gap: "var(--s-7)" }}>
      <section className="center stack fade-in" style={{ paddingTop: "var(--s-5)" }}>
        <span className="eyebrow">For women who run</span>
        <h1 className="h1" style={{ maxWidth: 760 }}>
          Train <span className="gradient-text">with</span> your cycle, not against it.
        </h1>
        <p className="muted" style={{ maxWidth: 520, fontSize: "var(--fs-lg)" }}>
          PacePrincess AI adjusts every run to your cycle phase, so you push on your strong days and recover on the rest.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link href="/onboarding" className="btn btn-primary">
            Build my plan in 60 sec <span className="arrow">→</span>
          </Link>
        </div>
        <p className="muted small">No account needed to start.</p>
      </section>

      <section className="grid-3">
        {[
          { t: "Knows your phase", d: "Tell us your last period and cycle length. We map every day of your month." },
          { t: "Adjusts the effort", d: "Intensity, pace zone and duration shift daily: hard when you're strong, easy when you're not." },
          { t: "Coaches recovery", d: "Fuelling, sleep and warm-up cues for each phase, right next to your run." },
        ].map((f) => (
          <div key={f.t} className="card stack-sm">
            <h3 className="h3">{f.t}</h3>
            <p className="muted">{f.d}</p>
          </div>
        ))}
      </section>

      <section className="stack">
        <h2 className="h2" style={{ textAlign: "center" }}>
          Four phases, four ways to run
        </h2>
        <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {phases.map(([key, p]) => (
            <div key={key} className={`card card-tight phase-${key} phase-hero stack-sm`}>
              <div className="row">
                <span className="phase-dot" />
                <b>
                  {p.emoji} {p.label}
                </b>
              </div>
              <p className="muted small">{p.blurb}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
