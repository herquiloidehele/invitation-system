import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import { routing } from "./i18n/routing";
import { verifyJwt, AUTH_COOKIE_NAME } from "@/lib/auth";
import {
  CURRENCY_COOKIE,
  GEO_CURRENCY_COOKIE,
  currencyForCountry,
} from "@/lib/currency/config";
import { clientIpFromForwardedFor, lookupCountry } from "@/lib/currency/geo-lookup";

const GEO_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

async function maybeSetGeoCurrencyCookie(
  request: NextRequest,
  response: NextResponse,
): Promise<void> {
  // Once per visitor: skip if they already chose, or we already guessed.
  if (
    request.cookies.has(CURRENCY_COOKIE) ||
    request.cookies.has(GEO_CURRENCY_COOKIE)
  ) {
    return;
  }
  const ip = clientIpFromForwardedFor(request.headers.get("x-forwarded-for"));
  const country = await lookupCountry(ip);
  response.cookies.set(GEO_CURRENCY_COOKIE, currencyForCountry(country), {
    path: "/",
    maxAge: GEO_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

const intlMiddleware = createIntlMiddleware(routing);

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname === "/api/upload/presign"
  );
}

function shouldRunI18n(pathname: string) {
  return (
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/_vercel") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/login") &&
    !pathname.includes(".")
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname)) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const payload = token ? await verifyJwt(token) : null;

    if (!payload) {
      const isApiRoute = pathname.startsWith("/api/");

      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  if (shouldRunI18n(pathname)) {
    const response = intlMiddleware(request);
    await maybeSetGeoCurrencyCookie(request, response);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
