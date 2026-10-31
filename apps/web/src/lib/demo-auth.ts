import type { NextResponse } from "next/server";
import { getDataStore } from "@/lib/db";
import { DEMO_SESSION_COOKIE, demoSessionCookieOptions } from "@/lib/auth";

export async function issueDemoSession(res: NextResponse, userId: string): Promise<void> {
  const store = await getDataStore();
  const token = store.demoIssueToken(userId);
  res.cookies.set(DEMO_SESSION_COOKIE, token, demoSessionCookieOptions);
}

export function clearDemoSession(res: NextResponse): void {
  res.cookies.set(DEMO_SESSION_COOKIE, "", { ...demoSessionCookieOptions, maxAge: 0 });
}
