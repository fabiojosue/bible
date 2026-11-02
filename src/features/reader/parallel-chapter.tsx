"use client";

import { type ReactNode, Suspense, use } from "react";
import { verseAnchor } from "@/features/bible/routes";
import { TRANSLATIONS, type TranslationId } from "@/features/bible/translations";
import type { ChapterContent } from "@/features/bible/types";
import { useSettings } from "@/features/settings/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { VerseNumber } from "./chapter-text";
import { VerseText } from "./verse-text";

const cache = new Map<string, Promise<ChapterContent | null>>();

/** Cached so `use()` receives a stable promise across renders. Resolves to null on failure. */
function fetchChapter(translation: TranslationId, bookId: string, chapter: number) {
  const key = `${translation}/${bookId}/${chapter}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = fetch(`/api/chapters/${key}`)
      .then((response) => (response.ok ? (response.json() as Promise<ChapterContent>) : null))
      .catch(() => null);
    cache.set(key, pending);
    // Allow a retry later if this request failed (e.g. offline).
    void pending.then((result) => result ?? cache.delete(key));
  }
  return pending;
}

interface ChapterBodyProps {
  bookId: string;
  chapter: number;
  primary: TranslationId;
  secondary: TranslationId;
  /** The server-rendered single-translation chapter. */
  children: ReactNode;
}

/**
 * Shows the server-rendered chapter, or both translations verse by verse when
 * side-by-side mode is on. The single view stays visible while loading.
 */
export function ChapterBody(props: ChapterBodyProps) {
  const parallel = useSettings((state) => state.parallel);
  const hydrated = useHydrated();
  if (!hydrated || !parallel) return props.children;
  return (
    <Suspense fallback={props.children}>
      <ParallelChapter {...props} />
    </Suspense>
  );
}

function ParallelChapter({ bookId, chapter, primary, secondary, children }: ChapterBodyProps) {
  const left = use(fetchChapter(primary, bookId, chapter));
  const right = use(fetchChapter(secondary, bookId, chapter));
  if (!left || !right) return children;

  const rightByNumber = new Map(right.verses.map((verse) => [verse.number, verse.text]));
  const leftByNumber = new Map(left.verses.map((verse) => [verse.number, verse.text]));
  const numbers = [...new Set([...leftByNumber.keys(), ...rightByNumber.keys()])].sort(
    (a, b) => a - b,
  );
  const primaryLang = TRANSLATIONS[primary].language;
  const secondaryLang = TRANSLATIONS[secondary].language;

  return (
    <div className="reader-text">
      <div
        aria-hidden
        className="mb-4 hidden grid-cols-2 gap-x-10 border-b pb-2 font-sans text-xs font-medium tracking-wide text-muted-foreground uppercase md:grid"
      >
        <span>{TRANSLATIONS[primary].name}</span>
        <span>{TRANSLATIONS[secondary].name}</span>
      </div>
      <div className="space-y-[0.9em] md:space-y-[0.5em]">
        {numbers.map((number) => {
          const primaryText = leftByNumber.get(number);
          const secondaryText = rightByNumber.get(number);
          return (
            <div
              key={number}
              id={verseAnchor(number)}
              data-verse={number}
              tabIndex={-1}
              className="verse grid gap-x-10 gap-y-1.5 outline-none md:grid-cols-2"
            >
              <p lang={primaryLang}>
                <VerseNumber number={number} />
                {primaryText && <VerseText text={primaryText} />}
              </p>
              <p
                lang={secondaryLang}
                className="border-l-2 pl-3 text-[0.92em] text-muted-foreground md:border-l-0 md:pl-0 md:text-[1em]"
              >
                <span className="verse-number mr-1.5 align-[0.35em] font-sans text-[0.6em] font-medium tabular-nums md:hidden">
                  {TRANSLATIONS[secondary].abbreviation}
                </span>
                {secondaryText && <VerseText text={secondaryText} />}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
