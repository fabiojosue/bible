/** A verse as stored on disk: `[verseNumber, text]`. */
export type VerseTuple = readonly [number, string];

export interface Verse {
  readonly number: number;
  readonly text: string;
}

export interface ChapterContent {
  readonly bookId: string;
  readonly chapter: number;
  readonly verses: readonly Verse[];
}

/** A position in the canon. `verse` is optional so it can describe whole chapters. */
export interface Reference {
  readonly bookId: string;
  readonly chapter: number;
  readonly verse?: number;
}
