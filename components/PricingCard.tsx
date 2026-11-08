"use client";
import { useState } from "react";
import Link from "next/link";
import { PRO_PLAN, formatPrice, pricePerDay } from "@/lib/plans";
import { CheckoutSheet } from "./CheckoutSheet";
import type { Account } from "./useAccount";

export function PricingCard({ account, onPaid }: { account: Account | null; onPaid?: (a: Account) => void }) {
  const [open, setOpen] = useState(false);
  const isPro = account?.plan === "pro";
  return (
    <section className="card pricing-card stack" aria-labelledby="pro-title" data-testid="pricing-card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="badge badge-pink">Cycle-synced</span>
        <span className="badge">Monthly</span>
      </div>
      <h2 className="h2" id="pro-title">
        PacePrincess AI Pro
      </h2>
      <div className="stack-sm">
        <div className="price">
          <span className="price-amount">{formatPrice(PRO_PLAN.priceCents)}</span>
          <span className="muted">/month</span>
        </div>
        <p className="muted small">
          That&apos;s {pricePerDay(PRO_PLAN.priceCents)} a day, less than a sports gel.
        </p>
      </div>
      <ul className="benefits">
        {PRO_PLAN.benefits.map((b) => (
          <li key={b}>
            <span className="tick" aria-hidden>
              ✓
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {isPro ? (
        <div className="stack-sm">
          <span className="badge badge-green" style={{ alignSelf: "flex-start" }}>
            ● You&apos;re on Pro
          </span>
          <Link href="/train" className="btn btn-primary btn-block">
            Open my training <span className="arrow">→</span>
          </Link>
          <Link href="/account" className="btn btn-ghost btn-block">
            Manage subscription
          </Link>
        </div>
      ) : (
        <button className="btn btn-primary btn-block" onClick={() => setOpen(true)} disabled={!account}>
          Subscribe to Pro <span className="arrow">→</span>
        </button>
      )}
      <p className="muted small" style={{ textAlign: "center" }}>
        Cancel anytime in account settings.
      </p>
      {open && (
        <CheckoutSheet
          onClose={() => setOpen(false)}
          onPaid={(a) => onPaid?.(a)}
        />
      )}
    </section>
  );
}
