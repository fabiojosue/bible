import type { Locale } from "@/i18n/routing";
import { type BookDefinition, bookSlug, getBook, getBookBySlug } from "./books";
import type { Reference } from "./types";

/**
 * Locale-relative paths (next-intl's `Link` adds the locale prefix).
 * Book slugs are localized: /john/3 in English, /juan/3 in Spanish.
 */

export const verseAnchor = (verse: number) => `v${verse}`;

export function bookPath(book: BookDefinition, locale: Locale): string {
  return `/${bookSlug(book, locale)}`;
}

export function chapterPath({ bookId, chapter, verse }: Reference, locale: Locale): string {
  const book = getBook(bookId);
  if (!book) return "/";
  const base = `${bookPath(book, locale)}/${chapter}`;
  return verse ? `${base}#${verseAnchor(verse)}` : base;
}

export interface PathLocation {
  readonly book: BookDefinition;
  readonly chapter?: number;
}

/** Reads the book/chapter out of a locale-relative pathname like `/john/3`. */
export function parsePath(pathname: string, locale: Locale): PathLocation | undefined {
  const [slug, chapterSegment, ...rest] = pathname.split("/").filter(Boolean);
  if (!slug || rest.length) return undefined;
  const book = getBookBySlug(decodeURIComponent(slug), locale);
  if (!book) return undefined;
  if (chapterSegment === undefined) return { book };
  const chapter = Number(chapterSegment);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) return undefined;
  return { book, chapter };
}

/** Absolute URL of the same page in another language, optionally at a verse. */
export function localeHref(pathname: string, from: Locale, to: Locale, verse?: number): string {
  const path = localizePath(pathname, from, to);
  const href = path === "/" ? `/${to}` : `/${to}${path}`;
  return verse ? `${href}#${verseAnchor(verse)}` : href;
}

/** The equivalent locale-relative pathname in another language. */
export function localizePath(pathname: string, from: Locale, to: Locale): string {
  const location = parsePath(pathname, from);
  if (!location) return pathname;
  return location.chapter
    ? chapterPath({ bookId: location.book.id, chapter: location.chapter }, to)
    : bookPath(location.book, to);
}
