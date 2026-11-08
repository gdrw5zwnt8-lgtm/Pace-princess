import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export type Profile = {
  lastPeriodStart: string; // YYYY-MM-DD
  cycleLength: number; // days
  periodLength: number; // days
  weeklyRuns: number;
  level: "new" | "regular" | "racer";
};

export type Subscription = {
  kwopSubscriptionId: string;
  planId: string;
  status: "active" | "canceled";
  startedAt: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  last4: string;
};

export type Session = {
  userId: string;
  profile?: Profile;
  subscription?: Subscription;
  usage?: { period: string; count: number };
  pendingCheckout?: { id: string; planId: string; createdAt: string };
};

const COOKIE = "pp_session";
const SECRET = process.env.SESSION_SECRET || "dev-only-secret-change-me";

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function decode(raw: string | undefined): Session | null {
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
  } catch {
    return null;
  }
}

/** Read the signed session (tamper-proof: the HMAC is checked on every read). */
export async function getSession(): Promise<Session> {
  const jar = await cookies();
  return decode(jar.get(COOKIE)?.value) ?? { userId: randomUUID() };
}

/** Only callable from route handlers. */
export async function saveSession(s: Session) {
  const payload = Buffer.from(JSON.stringify(s)).toString("base64url");
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
