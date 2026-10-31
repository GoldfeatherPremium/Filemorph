"use client";

import { createBrowserClient } from "@supabase/ssr";
import { serverEnv } from "@/lib/env";

function makeClient() {
  const env = serverEnv();
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase is not configured — run in demo mode or set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}

const g = globalThis as unknown as { __fmSupabaseBrowser?: ReturnType<typeof makeClient> };

export function getSupabaseBrowser() {
  if (!g.__fmSupabaseBrowser) g.__fmSupabaseBrowser = makeClient();
  return g.__fmSupabaseBrowser;
}
