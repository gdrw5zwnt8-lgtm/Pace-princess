"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Checkmark } from "./Checkmark";
import { api, type Account } from "./useAccount";
import { formatPrice } from "@/lib/plans";

type Checkout = { checkoutId: string; amountCents: number; currency: string; planName: string; testMode: boolean };

function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}
function formatExp(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
}

/** In-page checkout: a sheet over the current page, never a redirect. */
export function CheckoutSheet({ onClose, onPaid }: { onClose: () => void; onPaid: (a: Account) => void }) {
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [card, setCard] = useState({ name: "", number: "", exp: "", cvc: "" });
  const first = useRef<HTMLInputElement>(null);

  const open = () => {
    setLoadError(null);
    api<Checkout>("/api/checkout", { method: "POST" })
      .then((c) => {
        setCheckout(c);
        setTimeout(() => first.current?.focus(), 50);
      })
      .catch((e: Error) => setLoadError(e.message));
  };
  useEffect(open, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !paying && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, paying]);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkout) return;
    setPaying(true);
    setPayError(null);
    try {
      const res = await api<Account & { paid: boolean; error?: string }>("/api/checkout/confirm", {
        method: "POST",
        body: JSON.stringify({ checkoutId: checkout.checkoutId, card }),
      });
      if (!res.paid) {
        setPayError(res.error || "Payment failed. You were not charged.");
        return;
      }
      setDone(true);
      onPaid(res);
    } catch (err) {
      setPayError((err as Error).message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="overlay" onClick={() => !paying && !done && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="checkout-title" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="center stack fade-in" data-testid="checkout-success">
            <Checkmark />
            <h2 className="h2" id="checkout-title">
              Welcome to Pro 👑
            </h2>
            <p className="muted">Your cycle-synced training is unlocked. Today&apos;s run is already adjusted to your phase.</p>
            <Link href="/train" className="btn btn-primary btn-block">
              See today&apos;s run <span className="arrow">→</span>
            </Link>
          </div>
        ) : (
          <form className="stack" onSubmit={pay} noValidate>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 className="h3" id="checkout-title">
                Secure checkout
              </h2>
              <button type="button" className="link-btn" onClick={onClose} disabled={paying} aria-label="Close checkout">
                ✕
              </button>
            </div>

            {loadError ? (
              <div className="stack-sm">
                <div className="alert alert-error" role="alert">
                  {loadError}
                </div>
                <button type="button" className="btn btn-ghost" onClick={open}>
                  Try again
                </button>
              </div>
            ) : !checkout ? (
              <div className="stack-sm" aria-busy="true" aria-label="Loading checkout">
                <div className="skeleton" style={{ height: 56 }} />
                <div className="skeleton" style={{ height: 48 }} />
                <div className="skeleton" style={{ height: 48 }} />
                <div className="skeleton" style={{ height: 48 }} />
              </div>
            ) : (
              <>
                <div className="card card-tight row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{checkout.planName}</div>
                    <div className="muted small">Billed monthly · cancel anytime</div>
                  </div>
                  <div style={{ fontWeight: 800 }}>{formatPrice(checkout.amountCents)}/mo</div>
                </div>
                {checkout.testMode && (
                  <div className="alert alert-info">
                    Test mode: use card <b>4242 4242 4242 4242</b>, any future date, any CVC. No real charge.
                  </div>
                )}
                <label className="field">
                  <span className="label">Name on card</span>
                  <input ref={first} className="input" autoComplete="cc-name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                </label>
                <label className="field">
                  <span className="label">Card number</span>
                  <input className="input" inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" value={card.number} onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })} />
                </label>
                <div className="row" style={{ flexWrap: "nowrap" }}>
                  <label className="field" style={{ flex: 1 }}>
                    <span className="label">Expiry</span>
                    <input className="input" inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" value={card.exp} onChange={(e) => setCard({ ...card, exp: formatExp(e.target.value) })} />
                  </label>
                  <label className="field" style={{ flex: 1 }}>
                    <span className="label">CVC</span>
                    <input className="input" inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
                  </label>
                </div>
                {payError && (
                  <div className="alert alert-error" role="alert">
                    {payError}
                  </div>
                )}
                <button type="submit" className="btn btn-primary btn-block" disabled={paying}>
                  {paying ? (
                    <>
                      <span className="spinner" aria-hidden /> Processing…
                    </>
                  ) : (
                    <>Pay {formatPrice(checkout.amountCents)} and start Pro</>
                  )}
                </button>
                <div className="secure" style={{ justifyContent: "center" }}>
                  🔒 Encrypted payment by Kwop · Renews monthly until you cancel
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
