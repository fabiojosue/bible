import type { Reference } from "@/features/bible/types";

/*
 * Progress sync protocol shared by the browser and the server.
 *
 * Every piece of state carries the time it last changed and the newest change
 * wins, so devices can sync in any order, offline edits included.
 */

/** A chapter's read state. Unread marks are kept so an unmark can propagate. */
export interface ChapterMark {
  readonly read: boolean;
  /** Epoch milliseconds of the change. */
  readonly at: number;
}

/** chapterKey (`JHN.3`) -> mark. */
export type ChapterMarks = Readonly<Record<string, ChapterMark>>;

export interface SyncedPosition extends Reference {
  readonly verse: number;
}

/** Last reading position; `position: null` records that it was cleared. */
export interface PositionRecord {
  readonly position: SyncedPosition | null;
  readonly at: number;
}

/** A saved verse. Unsaved rows are kept so the removal reaches other devices. */
export interface VerseSave {
  readonly saved: boolean;
  readonly at: number;
  /** Verse text in `translation`, captured when it was saved. */
  readonly text: string;
  readonly translation: string;
}

/** verseKey (`JHN.3.16`) -> save. */
export type VerseSaves = Readonly<Record<string, VerseSave>>;

/** Sent by the browser: its changes since the last successful sync. */
export interface SyncRequest {
  readonly marks: ChapterMarks;
  readonly verses?: VerseSaves;
  readonly position?: PositionRecord;
}

/** Returned by the server: the full merged state for the account. */
export interface SyncResponse {
  readonly marks: ChapterMarks;
  readonly verses?: VerseSaves;
  readonly position: PositionRecord | null;
}

/** Applies `incoming` onto `current`, keeping the newer mark per chapter. */
export function mergeMarks(current: ChapterMarks, incoming: ChapterMarks): ChapterMarks {
  let merged: Record<string, ChapterMark> | undefined;
  for (const [key, mark] of Object.entries(incoming)) {
    const existing = current[key];
    if (existing && existing.at >= mark.at) continue;
    merged ??= { ...current };
    merged[key] = mark;
  }
  return merged ?? current;
}

export function newerPosition(
  current: PositionRecord | null,
  incoming: PositionRecord | null | undefined,
): PositionRecord | null {
  if (!incoming) return current;
  return !current || incoming.at > current.at ? incoming : current;
}

/** Marks changed after `since`, i.e. not yet confirmed by the server. */
export function marksChangedSince(marks: ChapterMarks, since: number): ChapterMarks {
  const changed: Record<string, ChapterMark> = {};
  for (const [key, mark] of Object.entries(marks)) if (mark.at > since) changed[key] = mark;
  return changed;
}

/** Applies `incoming` onto `current`, keeping the newer save per verse. */
export function mergeVerses(current: VerseSaves, incoming: VerseSaves | undefined): VerseSaves {
  if (!incoming) return current;
  let merged: Record<string, VerseSave> | undefined;
  for (const [key, save] of Object.entries(incoming)) {
    const existing = current[key];
    if (existing && existing.at >= save.at) continue;
    merged ??= { ...current };
    merged[key] = save;
  }
  return merged ?? current;
}

export function versesChangedSince(verses: VerseSaves, since: number): VerseSaves {
  const changed: Record<string, VerseSave> = {};
  for (const [key, save] of Object.entries(verses)) if (save.at > since) changed[key] = save;
  return changed;
}
