import { NextResponse } from "next/server";
import { getSession, saveSession } from "@/lib/session";
import { publicState } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  await saveSession(s); // persists the anonymous user id on first visit
  return NextResponse.json(publicState(s));
}
