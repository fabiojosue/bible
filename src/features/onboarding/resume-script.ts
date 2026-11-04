export const ONBOARDING_STORAGE_KEY = "bible:onboarding";

/**
 * Inline pre-paint script: when the tour is resuming after a language switch,
 * marks `<html>` so the page paints already dimmed instead of flashing without the tour.
 * It is serialized into the document head, so it cannot reference module scope.
 */
export const TOUR_RESUME_SCRIPT = `(() => {
  try {
    const stored = JSON.parse(localStorage.getItem(${JSON.stringify(ONBOARDING_STORAGE_KEY)}) || "null");
    if (stored && stored.state && stored.state.resumeStep != null) {
      document.documentElement.dataset.tourResume = "true";
    }
  } catch (e) {}
})();`;

export function endTourResume(): void {
  delete document.documentElement.dataset.tourResume;
}
