"use client";
import { useState } from "react";
import Link from "next/link";
import { api, useAccount, type Account } from "@/components/useAccount";
import { formatPrice } from "@/lib/plans";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function AccountPage() {
  const { account, setAccount, error, reload } = useAccount();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const act = async (action: "cancel" | "resume") => {
    setBusy(true);
    setActionError(null);
    try {
      setAccount(await api<Account>("/api/subscription", { method: "POST", body: JSON.stringify({ action }) }));
      setConfirming(false);
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sub = account?.subscription;
  return (
    <div className="container page">
      <div className="stack" style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1 className="h2">Account settings</h1>

        {error ? (
          <div className="stack-sm">
            <div className="alert alert-error" role="alert">
              {error}
            </div>
            <button className="btn btn-ghost" onClick={reload}>
              Try again
            </button>
          </div>
        ) : !account ? (
          <div className="stack" aria-busy="true" aria-label="Loading account">
            <div className="skeleton" style={{ height: 200, borderRadius: "var(--radius-lg)" }} />
            <div className="skeleton" style={{ height: 120, borderRadius: "var(--radius-lg)" }} />
          </div>
        ) : (
          <>
            <section className="card stack" data-testid="subscription-panel">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h2 className="h3">Subscription</h2>
                {sub?.active ? (
                  sub.cancelAtPeriodEnd ? (
                    <span className="badge">Cancels {fmt(sub.currentPeriodEnd)}</span>
                  ) : (
                    <span className="badge badge-green">● Active</span>
                  )
                ) : (
                  <span className="badge">Free</span>
                )}
              </div>

              {sub?.active ? (
                <>
                  <dl className="stack-sm" style={{ margin: 0 }}>
                    {[
                      ["Plan", sub.planName],
                      ["Price", `${formatPrice(sub.priceCents)}/month`],
                      ["Member since", fmt(sub.startedAt)],
                      [sub.cancelAtPeriodEnd ? "Access until" : "Next payment", fmt(sub.currentPeriodEnd)],
                      ["Card", `•••• ${sub.last4}`],
                    ].map(([k, v]) => (
                      <div key={k} className="row" style={{ justifyContent: "space-between" }}>
                        <dt className="muted">{k}</dt>
                        <dd style={{ margin: 0, fontWeight: 600 }}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {account.usage && (
                    <p className="muted small">
                      Plan refreshes used this month: {account.usage.used} of {account.usage.limit}
                    </p>
                  )}
                  {actionError && (
                    <div className="alert alert-error" role="alert">
                      {actionError}
                    </div>
                  )}
                  {sub.cancelAtPeriodEnd ? (
                    <button className="btn btn-primary" onClick={() => act("resume")} disabled={busy}>
                      {busy ? <span className="spinner" aria-hidden /> : null} Resume subscription
                    </button>
                  ) : confirming ? (
                    <div className="card card-tight stack-sm">
                      <b>Cancel PacePrincess AI Pro?</b>
                      <p className="muted small">You keep Pro until {fmt(sub.currentPeriodEnd)}. You won&apos;t be charged again.</p>
                      <div className="row">
                        <button className="btn btn-danger" onClick={() => act("cancel")} disabled={busy}>
                          {busy ? <span className="spinner" aria-hidden /> : null} Yes, cancel
                        </button>
                        <button className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={busy}>
                          Keep Pro
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-ghost" onClick={() => setConfirming(true)}>
                      Cancel subscription
                    </button>
                  )}
                </>
              ) : (
                <div className="stack-sm">
                  <p className="muted">You&apos;re on the free phase tracker. Pro adjusts every run to your cycle.</p>
                  <Link href="/pricing" className="btn btn-primary">
                    See PacePrincess AI Pro <span className="arrow">→</span>
                  </Link>
                </div>
              )}
            </section>

            <section className="card stack-sm">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h2 className="h3">Cycle profile</h2>
                <Link href="/onboarding" className="nav-link">
                  {account.profile ? "Edit" : "Set up"}
                </Link>
              </div>
              {account.profile ? (
                <p className="muted">
                  Last period {fmt(account.profile.lastPeriodStart + "T00:00:00")} · {account.profile.cycleLength}-day cycle ·{" "}
                  {account.profile.weeklyRuns} runs a week
                </p>
              ) : (
                <p className="muted">No cycle data yet.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
