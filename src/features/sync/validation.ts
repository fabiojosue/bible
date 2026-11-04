import { z } from "zod";
import { chapterKey, getBook, isValidReference, parseVerseKey } from "@/features/bible/books";
import type { SyncRequest } from "./protocol";

/** Clocks drift; changes stamped further in the future than this are rejected. */
const MAX_CLOCK_SKEW = 5 * 60 * 1000;
const timestamp = z.number().int().positive();

const syncRequestSchema = z.object({
  marks: z
    .record(z.string().max(16), z.object({ read: z.boolean(), at: timestamp }))
    .refine((marks) => Object.keys(marks).length <= 1189 * 2, "Too many marks"),
  verses: z
    .record(
      z.string().max(24),
      z.object({
        saved: z.boolean(),
        at: timestamp,
        text: z.string().max(4000),
        translation: z.enum(["web", "rv1909"]),
      }),
    )
    .refine((verses) => Object.keys(verses).length <= 2000, "Too many verses")
    .optional(),
  position: z
    .object({
      position: z
        .object({
          bookId: z.string().max(8),
          chapter: z.number().int(),
          verse: z.number().int().positive().max(200),
        })
        .nullable(),
      at: timestamp,
    })
    .optional(),
});

function isChapterKey(key: string): boolean {
  const [bookId, chapter, ...rest] = key.split(".");
  if (!bookId || !chapter || rest.length || !getBook(bookId)) return false;
  const reference = { bookId, chapter: Number(chapter) };
  return isValidReference(reference) && chapterKey(bookId, reference.chapter) === key;
}

/** Validates an untrusted request body; returns undefined when it is malformed. */
export function parseSyncRequest(body: unknown, now = Date.now()): SyncRequest | undefined {
  const parsed = syncRequestSchema.safeParse(body);
  if (!parsed.success) return undefined;
  const { marks, position, verses = {} } = parsed.data;
  const latest = now + MAX_CLOCK_SKEW;
  if (Object.values(marks).some((mark) => mark.at > latest)) return undefined;
  if (Object.values(verses).some((save) => save.at > latest)) return undefined;
  if (!Object.keys(marks).every(isChapterKey)) return undefined;
  if (!Object.keys(verses).every((key) => parseVerseKey(key))) return undefined;
  if (
    position &&
    (position.at > latest || (position.position && !isValidReference(position.position)))
  ) {
    return undefined;
  }
  return { marks, verses, position };
}
