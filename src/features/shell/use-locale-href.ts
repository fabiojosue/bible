"use client";

import { useLocale } from "next-intl";
import { localeHref, parsePath } from "@/features/bible/routes";
import { useProgress } from "@/features/progress/store";
import { usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/**
 * URL of the current page in another language, keeping the verse being read.
 *
 * Changing language swaps the whole `[locale]` layout. A client-side transition
 * would keep the previous layout mounted but hidden, along with any open menu or
 * dialog and the page lock it holds, so callers must do a full page load.
 */
export function useLocaleHref(): (target: Locale) => string {
  const locale = useLocale();
  const pathname = usePathname();
  const lastPosition = useProgress((state) => state.lastPosition);

  const current = parsePath(pathname, locale);
  const verse =
    current?.chapter &&
    lastPosition?.bookId === current.book.id &&
    lastPosition.chapter === current.chapter &&
    lastPosition.verse > 1
      ? lastPosition.verse
      : undefined;

  return (target) => localeHref(pathname, locale, target, verse);
}
