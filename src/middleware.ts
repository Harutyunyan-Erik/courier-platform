import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const STAFF = ["SUPER_ADMIN", "MANAGER", "COURIER"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const [, first, second] = pathname.split("/");

  if (!(LOCALES as readonly string[]).includes(first)) {
    const preferred = req.headers.get("accept-language")?.slice(0, 2);
    const locale = (LOCALES as readonly string[]).includes(preferred ?? "") ? preferred : DEFAULT_LOCALE;
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  if (second === "admin" || second === "account" || second === "password") {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySession(token) : null;
    if (!session) return NextResponse.redirect(new URL(`/${first}/login?next=${encodeURIComponent(pathname)}`, req.url));
    if (second === "admin" && !STAFF.includes(session.role)) return NextResponse.redirect(new URL(`/${first}`, req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
