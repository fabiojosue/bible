"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { verseAnchor } from "@/features/bible/routes";
import { useProgress } from "@/features/progress/store";
import { focusVerse, onVerseFocusRequest, verseFromHash } from "./verse-focus";
import { VerseActions } from "./verse-actions";

/** Distance from the top of the viewport at which a verse counts as "being read". */
const READING_LINE = 96;
const SAVE_DELAY = 500;
/** How long the end of the chapter must stay visible before it counts as read. */
const COMPLETE_DELAY = 1500;

function currentVerse(container: HTMLElement): number | undefined {
  const verses = container.querySelectorAll<HTMLElement>("[data-verse]");
  let low = 0;
  let high = verses.length - 1;
  let found: HTMLElement | undefined;
  // Binary search for the first verse whose bottom edge is below the reading line.
  while (low <= high) {
    const mid = (low + high) >> 1;
    const element = verses[mid]!;
    if (element.getBoundingClientRect().bottom > READING_LINE) {
      found = element;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return found ? Number(found.dataset.verse) : undefined;
}

interface ReadingTrackerProps {
  bookId: string;
  chapter: number;
  className?: string;
  children: ReactNode;
}

/**
 * Wraps the chapter text. Saves the verse being read (debounced), marks the
 * chapter as read once its end has been on screen for a moment, and handles
 * jumps to `#v<n>` anchors.
 */
export function ReadingTracker({ bookId, chapter, className, children }: ReadingTrackerProps) {
  const savePosition = useProgress((state) => state.savePosition);
  const markRead = useProgress((state) => state.markRead);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<{ verse: number; text: string } | null>(null);
  const selectedRef = useRef(selected);
  const locationKey = `${bookId}.${chapter}`;
  const [seenLocation, setSeenLocation] = useState(locationKey);
  if (seenLocation !== locationKey) {
    setSeenLocation(locationKey);
    setSelected(null);
  }

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initial = verseFromHash(window.location.hash);
    if (initial && !focusVerse(container, initial, { smooth: false })) {
      // The verse doesn't exist in this translation; fall back to the chapter start.
      history.replaceState(history.state, "", window.location.pathname);
    }
    // The reader may have scrolled before this streamed section hydrated.
    let anchor = initial ?? currentVerse(container) ?? 1;
    savePosition({ bookId, chapter, verse: anchor });

    // Switching layouts (e.g. side-by-side) reflows the text; keep the reader's verse in place.
    const layoutObserver = new MutationObserver(() => {
      if (anchor <= 1) return;
      container
        .querySelector<HTMLElement>(`[id="${verseAnchor(anchor)}"]`)
        ?.scrollIntoView({ block: "start" });
    });
    const markSelected = () => {
      const current = selectedRef.current?.verse;
      for (const element of container.querySelectorAll<HTMLElement>("[data-selected]")) {
        element.removeAttribute("data-selected");
      }
      if (current) {
        container
          .querySelector<HTMLElement>(`[data-verse="${current}"]`)
          ?.setAttribute("data-selected", "true");
      }
    };
    layoutObserver.observe(container, { childList: true, subtree: true });
    const selectionObserver = new MutationObserver(markSelected);
    selectionObserver.observe(container, { childList: true, subtree: true });
    markSelected();

    let frame = 0;
    let timer: number | undefined;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const verse = currentVerse(container);
        if (!verse) return;
        anchor = verse;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => savePosition({ bookId, chapter, verse }), SAVE_DELAY);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    const stopFocusRequests = onVerseFocusRequest((verse) => focusVerse(container, verse));
    return () => {
      window.removeEventListener("scroll", onScroll);
      layoutObserver.disconnect();
      selectionObserver.disconnect();
      stopFocusRequests();
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [bookId, chapter, savePosition]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    for (const element of container.querySelectorAll<HTMLElement>("[data-selected]")) {
      element.removeAttribute("data-selected");
    }
    if (!selected) return;
    container
      .querySelector<HTMLElement>(`[data-verse="${selected.verse}"]`)
      ?.setAttribute("data-selected", "true");
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    let timer: number | undefined;
    let endVisible = false;
    const observer = new IntersectionObserver(([entry]) => {
      window.clearTimeout(timer);
      endVisible = !!entry?.isIntersecting;
      if (endVisible) timer = window.setTimeout(() => markRead(bookId, chapter), COMPLETE_DELAY);
    });
    observer.observe(sentinel);
    // Leaving with the end on screen, e.g. tapping "Next chapter", also means the chapter was finished.
    const onPageHide = () => endVisible && markRead(bookId, chapter);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", onPageHide);
      onPageHide();
    };
  }, [bookId, chapter, markRead]);

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        onClick={(event) => {
          const verse = (event.target as HTMLElement).closest<HTMLElement>("[data-verse]");
          if (!verse || !containerRef.current?.contains(verse)) return;
          if (window.getSelection()?.toString()) return;
          const number = Number(verse.dataset.verse);
          if (!number) return;
          const text =
            verse.querySelector("[data-verse-text]")?.textContent?.replace(/\s+/g, " ").trim() ??
            "";
          if (!text) return;
          setSelected({ verse: number, text });
          verse.scrollIntoView({ block: "nearest" });
        }}
      >
        {children}
      </div>
      {selected && (
        <VerseActions
          bookId={bookId}
          chapter={chapter}
          verse={selected.verse}
          text={selected.text}
          onClose={() => setSelected(null)}
        />
      )}
      <div ref={sentinelRef} aria-hidden className="h-px" />
    </>
  );
}
