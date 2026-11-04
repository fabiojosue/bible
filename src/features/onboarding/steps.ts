import type en from "../../../messages/en.json";

type TourMessageKey = keyof (typeof en)["Tour"];

export interface TourStep {
  readonly id: string;
  /** `data-tour` value of the element to spotlight; omitted for centered steps. */
  readonly target?: string;
  /** Skip the step entirely if its target isn't visible (e.g. chapter controls on the home page). */
  readonly requiresTarget?: boolean;
  readonly title: TourMessageKey;
  readonly body: TourMessageKey;
  /** Alternate copy that mentions keyboard shortcuts on large screens. */
  readonly bodyDesktop?: TourMessageKey;
}

export const TOUR_STEPS: readonly TourStep[] = [
  // First, so the rest of the tour is in the language the reader actually wants.
  { id: "language", title: "languageTitle", body: "languageBody" },
  { id: "welcome", title: "welcomeTitle", body: "welcomeBody" },
  { id: "navigator", target: "navigator", title: "navigatorTitle", body: "navigatorBody" },
  {
    id: "search",
    target: "search",
    title: "searchTitle",
    body: "searchBody",
    bodyDesktop: "searchBodyDesktop",
  },
  { id: "settings", target: "settings", title: "settingsTitle", body: "settingsBody" },
  {
    id: "chapter-nav",
    target: "chapter-nav",
    requiresTarget: true,
    title: "chapterNavTitle",
    body: "chapterNavBody",
    bodyDesktop: "chapterNavBodyDesktop",
  },
  { id: "progress", target: "progress", title: "progressTitle", body: "progressBody" },
];

/** First visible element tagged with `data-tour="<target>"`; layouts render some twice. */
export function findTourTarget(target: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)].find(
    (element) => element.getClientRects().length > 0,
  );
}
