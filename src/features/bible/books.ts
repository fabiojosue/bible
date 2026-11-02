import type { Locale } from "@/i18n/routing";
import { BOOKS, type BookDefinition } from "./canon";
import type { Reference } from "./types";

export { BOOKS, type BookDefinition, type Testament } from "./canon";

/** Lowercase, accent-free, alphanumeric-only form used for slugs and matching. */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const BOOK_BY_ID = new Map(BOOKS.map((book) => [book.id, book]));

const BOOK_BY_SLUG: Record<Locale, Map<string, BookDefinition>> = {
  en: new Map(BOOKS.map((book) => [slugify(book.names.en), book])),
  es: new Map(BOOKS.map((book) => [slugify(book.names.es), book])),
};

export const TOTAL_CHAPTERS = BOOKS.reduce((sum, book) => sum + book.chapters, 0);

export function getBook(id: string): BookDefinition | undefined {
  return BOOK_BY_ID.get(id);
}

export function getBookBySlug(slug: string, locale: Locale): BookDefinition | undefined {
  return BOOK_BY_SLUG[locale].get(slug);
}

export function bookSlug(book: BookDefinition, locale: Locale): string {
  return slugify(book.names[locale]);
}

export function bookName(book: BookDefinition, locale: Locale): string {
  return book.names[locale];
}

export function isValidReference({ bookId, chapter, verse }: Reference): boolean {
  const book = getBook(bookId);
  return (
    !!book &&
    Number.isInteger(chapter) &&
    chapter >= 1 &&
    chapter <= book.chapters &&
    (verse === undefined || (Number.isInteger(verse) && verse >= 1))
  );
}

/** The chapter before or after the given one, crossing book boundaries. */
export function adjacentChapter(reference: Reference, direction: -1 | 1): Reference | undefined {
  const index = BOOKS.findIndex((book) => book.id === reference.bookId);
  const book = BOOKS[index];
  if (!book) return undefined;

  const chapter = reference.chapter + direction;
  if (chapter >= 1 && chapter <= book.chapters) return { bookId: book.id, chapter };

  const neighbor = BOOKS[index + direction];
  if (!neighbor) return undefined;
  return { bookId: neighbor.id, chapter: direction === 1 ? 1 : neighbor.chapters };
}

/** Stable key for a chapter, used by the progress store. */
export function chapterKey(bookId: string, chapter: number): string {
  return `${bookId}.${chapter}`;
}
