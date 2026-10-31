import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api";
import { getDataStore } from "@/lib/db";
import { DEMO_SESSION_COOKIE } from "@/lib/auth";
import { clearDemoSession } from "@/lib/demo-auth";

export const POST = apiRoute(async (req) => {
  const store = await getDataStore();
  const token = req.cookies.get(DEMO_SESSION_COOKIE)?.value;
  await store.demoSignOut(token);
  const res = NextResponse.json({ data: { ok: true } });
  clearDemoSession(res);
  return res;
});
