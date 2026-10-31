/**
 * Middleware-safe session helpers.
 *
 * The closest middleware runs on the Edge runtime, where Node built-in modules
 * (`node:crypto`, `node:fs`, `node:path`, ...) are not available. This module
 * intentionally has ZERO imports so it can be bundled safely for the edge
 * without pulling the database or demo store into the build.
 */

export const DEMO_SESSION_COOKIE = "fm_demo_session";
export const GUEST_TOKEN_COOKIE = "fm_guest";
export const SUPABASE_AUTH_TOKEN_SUFFIX = "-auth-token";

/** True when a cookie looks like a Supabase auth token cookie. */
export function isSupabaseAuthCookie(name: string): boolean {
  return name.startsWith("sb-") && name.endsWith(SUPABASE_AUTH_TOKEN_SUFFIX);
}

/** True when the request carries any session cookie (demo or Supabase). */
export function isAuthedByCookies(cookieNames: string[]): boolean {
  return cookieNames.some(
    (n) => n === DEMO_SESSION_COOKIE || isSupabaseAuthCookie(n),
  );
}
