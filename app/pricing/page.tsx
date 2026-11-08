"use client";
import { PricingCard } from "@/components/PricingCard";
import { useAccount } from "@/components/useAccount";

export default function PricingPage() {
  const { account, setAccount, error, reload } = useAccount();
  return (
    <div className="container page center stack">
      <span className="eyebrow">PacePrincess AI Pro</span>
      <h1 className="h2" style={{ maxWidth: 560 }}>
        Every run, tuned to where you are in your cycle
      </h1>
      {error && (
        <div className="alert alert-error row" role="alert">
          {error}
          <button className="link-btn" onClick={reload}>
            Retry
          </button>
        </div>
      )}
      <PricingCard account={account} onPaid={setAccount} />
    </div>
  );
}
