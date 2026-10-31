"use client";

/**
 * Public/client-side auth mode. When Supabase is configured we use the
 * Supabase browser client; otherwise the demo (in-repo) auth flow is used.
 */
export const AUTH_MODE: "supabase" | "demo" =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "supabase" : "demo";

export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}
