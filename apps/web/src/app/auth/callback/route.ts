import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Supabase Auth callback: exchanges the OAuth/email confirmation code for a
 * session, then redirects the user to the requested destination.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const url = new URL(`${origin}${safeNext}`);
      return NextResponse.redirect(url);
    }
  }
  const url = new URL(`${origin}/login`);
  url.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(url);
}
