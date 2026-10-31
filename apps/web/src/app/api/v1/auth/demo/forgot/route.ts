import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRoute, parseBody } from "@/lib/api";
import { isSupabaseMode } from "@/lib/auth";

const schema = z.object({ email: z.string().email() }).strict();

export const POST = apiRoute(async (req) => {
  if (isSupabaseMode()) {
    return NextResponse.json({ error: { code: "not_supported", message: "Use Supabase Auth." } }, { status: 409 });
  }
  await parseBody(req, schema);
  return NextResponse.json({ data: { ok: true, note: "Demo mode does not send emails." } });
});
