import { NextResponse, type NextRequest } from "next/server";
import {
  isAuthedByCookies,
  DEMO_SESSION_COOKIE,
  GUEST_TOKEN_COOKIE,
} from "@/lib/auth-middleware";

const PROTECTED_PREFIXES = ["/dashboard", "/app"];
const AUTH_PAGES = ["/login", "/signup"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) return NextResponse.next();

  const cookieNames = req.cookies.getAll().map((c) => c.name);
  const authed = isAuthedByCookies(cookieNames);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  // Ensure the guest cookie exists for anonymous visitors (set lazily by API).
  const guestCookie = req.cookies.get(GUEST_TOKEN_COOKIE);
  const demoCookie = req.cookies.get(DEMO_SESSION_COOKIE);
  void guestCookie;
  void demoCookie;
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/app/:path*", "/login", "/signup"],
};
