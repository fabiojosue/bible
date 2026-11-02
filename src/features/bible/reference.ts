import type { Locale } from "@/i18n/routing";
import { BOOKS, type BookDefinition, bookName, normalize } from "./books";
import type { Reference } from "./types";

export function formatReference({ bookId, chapter, verse }: Reference, locale: Locale): string {
  const book = BOOKS.find((b) => b.id === bookId);
  const name = book ? bookName(book, locale) : bookId;
  return verse ? `${name} ${chapter}:${verse}` : `${name} ${chapter}`;
}

const OTHER_LOCALE: Record<Locale, Locale> = { en: "es", es: "en" };

/** Lower is better; `undefined` means no match. */
function matchScore(book: BookDefinition, query: string, locale: Locale): number | undefined {
  if (book.aliases.includes(query)) return 0;
  const primary = normalize(book.names[locale]);
  const secondary = normalize(book.names[OTHER_LOCALE[locale]]);
  if (primary === query || secondary === query) return 1;
  if (primary.startsWith(query)) return 2;
  if (secondary.startsWith(query)) return 3;
  return undefined;
}

/** Books whose names (in either language) or aliases match the query, best first. */
export function searchBooks(query: string, locale: Locale): BookDefinition[] {
  const normalized = normalize(query);
  if (!normalized) return [...BOOKS];
  return BOOKS.map((book, order) => ({ book, order, score: matchScore(book, normalized, locale) }))
    .filter((entry): entry is typeof entry & { score: number } => entry.score !== undefined)
    .sort((a, b) => a.score - b.score || a.order - b.order)
    .map((entry) => entry.book);
}

export interface ParsedQuery {
  readonly book: BookDefinition;
  readonly chapter?: number;
  readonly verse?: number;
}

const QUERY = /^\s*([1-3]?\s*\p{L}[\p{L}\s.]*?)\.?\s*(\d+)?(?:\s*[:.,]\s*(\d+))?\s*$/u;

/**
 * Parses free-form references such as "John 3:16", "jn3", "1 cor 13.4" or "Salmos 23".
 * Out-of-range chapters are rejected; verse bounds are checked by the reader.
 */
export function parseQuery(input: string, locale: Locale): ParsedQuery | undefined {
  const match = QUERY.exec(input);
  if (!match) return undefined;
  const [, bookPart = "", chapterPart, versePart] = match;
  const book = searchBooks(bookPart, locale)[0];
  if (!book || !normalize(bookPart)) return undefined;

  const chapter = chapterPart ? Number(chapterPart) : undefined;
  if (chapter !== undefined && (chapter < 1 || chapter > book.chapters)) return undefined;

  const verse = chapter !== undefined && versePart ? Number(versePart) : undefined;
  if (verse !== undefined && verse < 1) return undefined;

  return { book, chapter, verse };
}

export function toReference(query: ParsedQuery): Reference {
  return { bookId: query.book.id, chapter: query.chapter ?? 1, verse: query.verse };
}
