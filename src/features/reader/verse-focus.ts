import { verseAnchor } from "@/features/bible/routes";

const VERSE_FOCUS_EVENT = "bible:verse-focus";

/**
 * Client-side navigation uses pushState, which neither fires `hashchange` nor
 * updates `:target`, so in-page verse jumps are signalled explicitly.
 */
export function requestVerseFocus(verse: number): void {
  window.dispatchEvent(new CustomEvent<number>(VERSE_FOCUS_EVENT, { detail: verse }));
}

export function onVerseFocusRequest(listener: (verse: number) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<number>).detail);
  window.addEventListener(VERSE_FOCUS_EVENT, handler);
  return () => window.removeEventListener(VERSE_FOCUS_EVENT, handler);
}

export function verseFromHash(hash: string): number | undefined {
  const match = /^#v(\d+)$/.exec(hash);
  return match ? Number(match[1]) : undefined;
}

const HIGHLIGHT_DURATION = 2400;
/** Input that means the reader has moved on; scroll alone also fires for our own jump. */
const MOVE_ON_EVENTS = ["wheel", "touchmove", "pointerdown", "keydown"] as const;

/**
 * Scrolls to a verse, highlights it briefly and moves focus to it for assistive tech.
 * The highlight clears as soon as the reader scrolls, taps or types.
 * Lookups are scoped to `container`: Next keeps recently visited pages mounted but
 * hidden, so ids like `v16` can exist more than once in the document.
 */
export function focusVerse(container: HTMLElement, verse: number, { smooth = true } = {}): boolean {
  const element = container.querySelector<HTMLElement>(`[id="${verseAnchor(verse)}"]`);
  if (!element) return false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ block: "start", behavior: smooth && !reduceMotion ? "smooth" : "auto" });
  element.focus({ preventScroll: true });
  element.dataset.highlighted = "true";

  const clear = () => {
    delete element.dataset.highlighted;
    window.clearTimeout(timer);
    for (const type of MOVE_ON_EVENTS) window.removeEventListener(type, clear);
  };
  const timer = window.setTimeout(clear, HIGHLIGHT_DURATION);
  for (const type of MOVE_ON_EVENTS) window.addEventListener(type, clear, { passive: true });
  return true;
}
