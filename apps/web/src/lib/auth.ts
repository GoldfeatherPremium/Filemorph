import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { UnauthorizedError } from "@filemorph/shared";
import { serverEnv } from "@/lib/env";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getDataStore } from "@/lib/db";

export const DEMO_SESSION_COOKIE = "fm_demo_session";
export const GUEST_TOKEN_COOKIE = "fm_guest";
const DEMO_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export interface SessionUser {
  userId: string;
  email?: string;
  /** true when authenticated through the in-repo demo store (no Supabase). */
  demo?: boolean;
}

async function getDemoUserId(): Promise<string | null> {
  const store = await getDataStore();
  const cs = await cookies();
  const token = cs.get(DEMO_SESSION_COOKIE)?.value;
  return store.demoVerifyToken(token);
}

/** Resolve the current authenticated user, or null. Works in both prod (Supabase Auth) and demo mode. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const env = serverEnv();
  if (env.supabaseUrl && env.supabaseAnonKey) {
    const sb = await createSupabaseServer();
    const { data } = await sb.auth.getUser();
    if (data.user) return { userId: data.user.id, email: data.user.email ?? undefined };
    return null;
  }
  const uid = await getDemoUserId();
  if (!uid) return null;
  const store = await getDataStore();
  const u = await store.getUserById(uid);
  return u ? { userId: uid, email: u.email, demo: true } : null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError("Sign in to continue.");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  const store = await getDataStore();
  const isAdmin = await store.isAdmin(user.userId);
  if (!isAdmin) throw new UnauthorizedError("Admin access required.");
  return user;
}

export interface OwnerContext {
  userId: string | null;
  ownerToken: string | null;
}

/**
 * Resolve ownership: authenticated users are identified by user id; anonymous
 * users get a long-lived guest token (stored in an httpOnly cookie).
 */
export async function getOwnerContext(): Promise<OwnerContext & { guestToken?: string; needGuestCookie?: boolean }> {
  const session = await getSessionUser();
  if (session) return { userId: session.userId, ownerToken: null };
  const cs = await cookies();
  let token = cs.get(GUEST_TOKEN_COOKIE)?.value;
  let needGuestCookie = false;
  if (!token) {
    token = randomUUID();
    needGuestCookie = true;
  }
  return { userId: null, ownerToken: token, guestToken: token, needGuestCookie };
}

export const demoSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: DEMO_SESSION_MAX_AGE,
};

export const guestCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

/**
 * Coarse cookie-based auth check for middleware (works on the edge runtime
 * without importing node-only modules).
 */
export function isAuthedByCookies(cookieNames: string[]): boolean {
  return cookieNames.some((n) => n === DEMO_SESSION_COOKIE || (n.startsWith("sb-") && n.endsWith("-auth-token")));
}

/** True when Supabase is configured (prod mode). */
export function isSupabaseMode(): boolean {
  const env = serverEnv();
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
