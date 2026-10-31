import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRoute, parseBody } from "@/lib/api";
import { getDataStore } from "@/lib/db";
import { isSupabaseMode } from "@/lib/auth";
import { issueDemoSession } from "@/lib/demo-auth";
import { sendEmail } from "@/lib/email";
import { APP_URL } from "@filemorph/shared";

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(200),
    fullName: z.string().max(120).optional(),
  })
  .strict();

export const POST = apiRoute(async (req) => {
  if (isSupabaseMode()) {
    return NextResponse.json({ error: { code: "not_supported", message: "Use Supabase Auth." } }, { status: 409 });
  }
  const body = await parseBody(req, schema);
  const store = await getDataStore();
  const { userId, error } = await store.demoSignUp(body.email, body.password, body.fullName);
  if (error || !userId) {
    return NextResponse.json({ error: { code: "signup_failed", message: error ?? "Sign up failed." } }, { status: 409 });
  }
  void sendEmail("welcome", { email: body.email.toLowerCase(), name: body.fullName ?? "", url: APP_URL });
  const res = NextResponse.json({ data: { ok: true } });
  await issueDemoSession(res, userId);
  return res;
});
