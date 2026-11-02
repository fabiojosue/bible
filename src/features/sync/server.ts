import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { chapterMark, readingPosition } from "@/db/schema";
import type { ChapterMark, PositionRecord, SyncRequest, SyncResponse } from "./protocol";

/** Applies the device's changes (newest wins) and returns the account's merged state. */
export async function syncProgress(userId: string, request: SyncRequest): Promise<SyncResponse> {
  const marks = Object.entries(request.marks).map(([key, mark]) => ({
    userId,
    chapterKey: key,
    read: mark.read,
    updatedAt: mark.at,
  }));

  await db.transaction(async (tx) => {
    if (marks.length) {
      await tx
        .insert(chapterMark)
        .values(marks)
        .onConflictDoUpdate({
          target: [chapterMark.userId, chapterMark.chapterKey],
          set: { read: sql`excluded.read`, updatedAt: sql`excluded.updated_at` },
          setWhere: sql`excluded.updated_at > ${chapterMark.updatedAt}`,
        });
    }
    if (request.position) {
      const { position, at } = request.position;
      await tx
        .insert(readingPosition)
        .values({
          userId,
          bookId: position?.bookId ?? null,
          chapter: position?.chapter ?? null,
          verse: position?.verse ?? null,
          updatedAt: at,
        })
        .onConflictDoUpdate({
          target: readingPosition.userId,
          set: {
            bookId: sql`excluded.book_id`,
            chapter: sql`excluded.chapter`,
            verse: sql`excluded.verse`,
            updatedAt: sql`excluded.updated_at`,
          },
          setWhere: sql`excluded.updated_at > ${readingPosition.updatedAt}`,
        });
    }
  });

  const [rows, positions] = await Promise.all([
    db
      .select({ key: chapterMark.chapterKey, read: chapterMark.read, at: chapterMark.updatedAt })
      .from(chapterMark)
      .where(eq(chapterMark.userId, userId)),
    db.select().from(readingPosition).where(eq(readingPosition.userId, userId)).limit(1),
  ]);

  const merged: Record<string, ChapterMark> = {};
  for (const row of rows) merged[row.key] = { read: row.read, at: row.at };

  const stored = positions[0];
  let position: PositionRecord | null = null;
  if (stored) {
    position = {
      position:
        stored.bookId && stored.chapter && stored.verse
          ? { bookId: stored.bookId, chapter: stored.chapter, verse: stored.verse }
          : null,
      at: stored.updatedAt,
    };
  }
  return { marks: merged, position };
}
