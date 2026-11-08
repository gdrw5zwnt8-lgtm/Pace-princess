"use client";
import { useCallback, useEffect, useState } from "react";

export type Account = {
  plan: "free" | "pro";
  profile: null | { lastPeriodStart: string; cycleLength: number; periodLength: number; weeklyRuns: number; level: string };
  subscription: null | {
    planName: string;
    priceCents: number;
    status: "active" | "canceling";
    startedAt: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    last4: string;
    active: boolean;
  };
  usage: null | { used: number; limit: number; left: number };
};

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Something went wrong. Please try again.");
  return data as T;
}

export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setError(null);
    api<Account>("/api/session")
      .then(setAccount)
      .catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);
  return { account, setAccount, error, reload: load };
}
