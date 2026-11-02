import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { getBook } from "./books";
import type { TranslationId } from "./translations";
import type { ChapterContent, VerseTuple } from "./types";

interface BookFile {
  readonly book: string;
  readonly chapters: readonly (readonly VerseTuple[])[];
}

const DATA_DIR = path.join(process.cwd(), "data", "bible");

const bookCache = new Map<string, Promise<BookFile>>();

function loadBook(translation: TranslationId, bookId: string): Promise<BookFile> {
  const key = `${translation}/${bookId}`;
  let pending = bookCache.get(key);
  if (!pending) {
    pending = readFile(path.join(DATA_DIR, translation, `${bookId}.json`), "utf8").then(
      (raw) => JSON.parse(raw) as BookFile,
    );
    bookCache.set(key, pending);
  }
  return pending;
}

export async function getChapter(
  translation: TranslationId,
  bookId: string,
  chapter: number,
): Promise<ChapterContent | undefined> {
  "use cache";
  cacheLife("max");
  if (!getBook(bookId)) return undefined;
  const file = await loadBook(translation, bookId);
  const verses = file.chapters[chapter - 1];
  if (!verses) return undefined;
  return {
    bookId,
    chapter,
    verses: verses.map(([number, text]) => ({ number, text })),
  };
}
