import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/organizations",
  "/events",
  "/tutors",
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requiresAuth = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const accessCookie = request.cookies.get("unisync_access");
  const refreshCookie = request.cookies.get("unisync_refresh");

  if (!accessCookie && !refreshCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/organizations/:path*", "/events/:path*", "/tutors/:path*"],
};
