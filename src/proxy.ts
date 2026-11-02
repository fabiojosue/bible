import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { isPagePath, parsePath } from "./features/bible/routes";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const LOCALIZED_PATH = new RegExp(`^/(${routing.locales.join("|")})(/.*)?$`);

/**
 * Rejects unknown books/chapters with a real 404. Pages can't do this themselves:
 * with Cache Components the static shell has already been sent when they render.
 */
function isUnknownPassage(pathname: string): boolean {
  const match = LOCALIZED_PATH.exec(pathname);
  if (!match) return false;
  const locale = match[1] as (typeof routing.locales)[number];
  const rest = match[2] ?? "/";
  return rest !== "/" && !isPagePath(rest) && !parsePath(rest, locale);
}

export default function proxy(request: NextRequest) {
  if (isUnknownPassage(request.nextUrl.pathname)) {
    return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
