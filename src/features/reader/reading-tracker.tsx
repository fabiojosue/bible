"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { verseAnchor } from "@/features/bible/routes";
import { useProgress } from "@/features/progress/store";
import { focusVerse, onVerseFocusRequest, verseFromHash } from "./verse-focus";

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
    layoutObserver.observe(container, { childList: true, subtree: true });

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
      stopFocusRequests();
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [bookId, chapter, savePosition]);

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
      <div ref={containerRef} className={className}>
        {children}
      </div>
      <div ref={sentinelRef} aria-hidden className="h-px" />
    </>
  );
}
