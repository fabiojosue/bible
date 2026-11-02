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

/**
 * Scrolls to a verse, highlights it briefly and moves focus to it for assistive tech.
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
  window.setTimeout(() => delete element.dataset.highlighted, 2400);
  return true;
}
