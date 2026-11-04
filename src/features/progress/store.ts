"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { chapterKey } from "@/features/bible/books";
import type { Reference } from "@/features/bible/types";
import {
  type ChapterMark,
  type ChapterMarks,
  mergeMarks,
  mergeVerses,
  newerPosition,
  type PositionRecord,
  type SyncResponse,
  type VerseSave,
  type VerseSaves,
} from "@/features/sync/protocol";

export interface ReadingPosition extends Reference {
  readonly verse: number;
  readonly updatedAt: number;
}

interface PersistedProgress {
  /** Every chapter ever marked, including ones marked unread again. */
  readonly marks: ChapterMarks;
  /** Every verse ever saved, including ones removed again. */
  readonly verses: VerseSaves;
  readonly lastPosition: ReadingPosition | null;
  /** When `lastPosition` last changed, including being cleared. */
  readonly positionAt: number;
}

interface ProgressState extends PersistedProgress {
  /** Derived from `marks`: chapterKey -> time it was read, for read chapters only. */
  readonly readChapters: Readonly<Record<string, number>>;
}

interface ProgressActions {
  savePosition: (reference: Reference & { verse: number }) => void;
  markRead: (bookId: string, chapter: number) => void;
  setRead: (bookId: string, chapter: number, read: boolean) => void;
  /** `snapshot` is the text shown to the reader; an unsave can omit it. */
  setVerseSaved: (
    key: string,
    saved: boolean,
    snapshot?: { text: string; translation: string },
  ) => void;
  reset: () => void;
  /** Merges the account's state from the server. */
  applyRemote: (remote: SyncResponse) => void;
}

function readChaptersOf(marks: ChapterMarks): Record<string, number> {
  const read: Record<string, number> = {};
  for (const [key, mark] of Object.entries(marks)) if (mark.read) read[key] = mark.at;
  return read;
}

function withMarks(marks: ChapterMarks): Pick<ProgressState, "marks" | "readChapters"> {
  return { marks, readChapters: readChaptersOf(marks) };
}

export function positionRecordOf(state: PersistedProgress): PositionRecord | null {
  if (!state.positionAt) return null;
  const position = state.lastPosition;
  return {
    position: position
      ? { bookId: position.bookId, chapter: position.chapter, verse: position.verse }
      : null,
    at: state.positionAt,
  };
}

export const useProgress = create<ProgressState & ProgressActions>()(
  persist(
    (set) => ({
      marks: {},
      verses: {},
      readChapters: {},
      lastPosition: null,
      positionAt: 0,
      savePosition: ({ bookId, chapter, verse }) => {
        const now = Date.now();
        set({ lastPosition: { bookId, chapter, verse, updatedAt: now }, positionAt: now });
      },
      markRead: (bookId, chapter) =>
        set((state) => {
          const key = chapterKey(bookId, chapter);
          if (state.marks[key]?.read) return state;
          return withMarks({ ...state.marks, [key]: { read: true, at: Date.now() } });
        }),
      setRead: (bookId, chapter, read) =>
        set((state) => {
          const key = chapterKey(bookId, chapter);
          if (!!state.marks[key]?.read === read) return state;
          return withMarks({ ...state.marks, [key]: { read, at: Date.now() } });
        }),
      setVerseSaved: (key, saved, snapshot) =>
        set((state) => {
          const existing = state.verses[key];
          if (!!existing?.saved === saved) return state;
          const next: VerseSave = {
            saved,
            at: Date.now(),
            text: (snapshot?.text ?? existing?.text ?? "").slice(0, 4000),
            translation: snapshot?.translation ?? existing?.translation ?? "web",
          };
          return { verses: { ...state.verses, [key]: next } };
        }),
      reset: () =>
        set((state) => {
          const now = Date.now();
          const marks: Record<string, ChapterMark> = {};
          for (const key of Object.keys(state.marks)) marks[key] = { read: false, at: now };
          const verses: Record<string, VerseSave> = {};
          for (const [key, save] of Object.entries(state.verses)) {
            verses[key] = { ...save, saved: false, at: now };
          }
          return { ...withMarks(marks), verses, lastPosition: null, positionAt: now };
        }),
      applyRemote: (remote) =>
        set((state) => {
          const marks = mergeMarks(state.marks, remote.marks);
          const verses = mergeVerses(state.verses, remote.verses);
          const current = positionRecordOf(state);
          const position = newerPosition(current, remote.position);
          if (marks === state.marks && verses === state.verses && position === current)
            return state;
          return {
            ...(marks === state.marks ? {} : withMarks(marks)),
            ...(verses === state.verses ? {} : { verses }),
            ...(position && position !== current
              ? {
                  lastPosition: position.position && {
                    ...position.position,
                    updatedAt: position.at,
                  },
                  positionAt: position.at,
                }
              : {}),
          };
        }),
    }),
    {
      name: "bible:progress",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ marks, verses, lastPosition, positionAt }): PersistedProgress => ({
        marks,
        verses,
        lastPosition,
        positionAt,
      }),
      migrate: (persisted, version) => {
        if (version < 2) {
          const v1 = persisted as {
            readChapters?: Record<string, number>;
            lastPosition?: ReadingPosition | null;
          };
          const marks: Record<string, ChapterMark> = {};
          for (const [key, at] of Object.entries(v1.readChapters ?? {}))
            marks[key] = { read: true, at };
          const lastPosition = v1.lastPosition ?? null;
          return { marks, verses: {}, lastPosition, positionAt: lastPosition?.updatedAt ?? 0 };
        }
        const saved = persisted as PersistedProgress;
        if (version < 3) return { ...saved, verses: saved.verses ?? {} };
        return saved;
      },
      merge: (persisted, current) => {
        const saved = persisted as Partial<PersistedProgress> | undefined;
        const marks = saved?.marks ?? current.marks;
        return { ...current, ...saved, ...withMarks(marks), verses: saved?.verses ?? {} };
      },
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
