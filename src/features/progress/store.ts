"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { chapterKey } from "@/features/bible/books";
import type { Reference } from "@/features/bible/types";

export interface ReadingPosition extends Reference {
  readonly verse: number;
  readonly updatedAt: number;
}

/**
 * Serializable progress snapshot. Timestamps make it possible to merge
 * snapshots from several devices once account sync exists.
 */
export interface ProgressSnapshot {
  /** chapterKey -> time the chapter was completed. */
  readonly readChapters: Readonly<Record<string, number>>;
  readonly lastPosition: ReadingPosition | null;
}

interface ProgressActions {
  savePosition: (reference: Reference & { verse: number }) => void;
  markRead: (bookId: string, chapter: number) => void;
  setRead: (bookId: string, chapter: number, read: boolean) => void;
  reset: () => void;
}

const EMPTY: ProgressSnapshot = { readChapters: {}, lastPosition: null };

export const useProgress = create<ProgressSnapshot & ProgressActions>()(
  persist(
    (set) => ({
      ...EMPTY,
      savePosition: ({ bookId, chapter, verse }) =>
        set({ lastPosition: { bookId, chapter, verse, updatedAt: Date.now() } }),
      markRead: (bookId, chapter) =>
        set((state) => {
          const key = chapterKey(bookId, chapter);
          if (state.readChapters[key]) return state;
          return { readChapters: { ...state.readChapters, [key]: Date.now() } };
        }),
      setRead: (bookId, chapter, read) =>
        set((state) => {
          const readChapters = { ...state.readChapters };
          const key = chapterKey(bookId, chapter);
          if (read) readChapters[key] = Date.now();
          else delete readChapters[key];
          return { readChapters };
        }),
      reset: () => set(EMPTY),
    }),
    {
      name: "bible:progress",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ readChapters, lastPosition }) => ({ readChapters, lastPosition }),
    },
  ),
);

export function countReadInBook(
  readChapters: Readonly<Record<string, number>>,
  bookId: string,
  chapters: number,
): number {
  let count = 0;
  for (let chapter = 1; chapter <= chapters; chapter++) {
    if (readChapters[chapterKey(bookId, chapter)]) count++;
  }
  return count;
}
