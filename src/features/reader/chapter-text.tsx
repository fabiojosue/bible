import { verseAnchor } from "@/features/bible/routes";
import type { Verse } from "@/features/bible/types";
import { VerseText } from "./verse-text";

export function VerseNumber({ number }: { number: number }) {
  return (
    <sup className="verse-number mr-1.5 align-[0.35em] font-sans text-[0.6em] font-medium text-muted-foreground tabular-nums select-none">
      {number}
    </sup>
  );
}

/** Single-translation chapter, rendered on the server. */
export function ChapterText({ verses }: { verses: readonly Verse[] }) {
  return (
    <div className="reader-text reader-measure mx-auto space-y-[0.35em]">
      {verses.map((verse) => (
        <p
          key={verse.number}
          id={verseAnchor(verse.number)}
          data-verse={verse.number}
          tabIndex={-1}
          className="verse outline-none"
        >
          <VerseNumber number={verse.number} />
          <VerseText text={verse.text} />
        </p>
      ))}
    </div>
  );
}
