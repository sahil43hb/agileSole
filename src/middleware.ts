import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { ADMIN_COOKIE } from "./shared/constants";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_ADMIN = ["/admin/login"];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.startsWith("/brand-icon")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const isPublic = PUBLIC_ADMIN.some((p) => pathname === p);
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!isPublic && !token) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    // Do not bounce /admin/login → /admin just because a cookie exists.
    // After a DB wipe the JWT can still be present while the staff row is gone,
    // which used to loop: login → /admin → requireAdmin → login.
    const res = NextResponse.next();
    res.headers.set("x-admin-path", pathname);
    return res;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
