import { type RefObject, useEffect, useState } from "react";

interface ScrollHiddenOptions {
  enabled?: boolean;
  /** The chrome itself: it never hides while a finger or pointer is down on it. */
  ref?: RefObject<HTMLElement | null>;
  /** Always shown above this scroll position. */
  threshold?: number;
  /** Downward scroll needed to hide; small jitters, like a tap that moves the page, don't count. */
  hideDistance?: number;
  /** Upward scroll needed to show again. */
  showDistance?: number;
}

/** After a pointer lifts or the viewport resizes, scrolling is not the reader's doing for this long. */
const SETTLE_MS = 400;

/**
 * True while the user scrolls down past `threshold`; false on scroll up or near
 * the top/bottom of the page. Used to tuck mobile chrome away while reading.
 */
export function useScrollHidden({
  enabled = true,
  ref,
  threshold = 80,
  hideDistance = 48,
  showDistance = 12,
}: ScrollHiddenOptions = {}): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    /** Where the current scroll direction started. */
    let anchorY = window.scrollY;
    let lastY = anchorY;
    let direction = 0;
    let height = window.innerHeight;
    let pressed = false;
    let settledAt = 0;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      // Mobile browsers resize the viewport as their toolbars collapse and expand,
      // shifting scrollY without the reader scrolling.
      if (window.innerHeight !== height) {
        height = window.innerHeight;
        settledAt = performance.now();
      }
      const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 40;
      const ignore = pressed || performance.now() - settledAt < SETTLE_MS;
      if (y < threshold || nearBottom) setHidden(false);
      if (y < threshold || nearBottom || ignore) {
        anchorY = lastY = y;
        direction = 0;
        return;
      }
      const delta = y - lastY;
      if (!delta) return;
      const next = delta > 0 ? 1 : -1;
      if (next !== direction) {
        direction = next;
        anchorY = lastY;
      }
      lastY = y;
      if (direction > 0 && y - anchorY > hideDistance) setHidden(true);
      else if (direction < 0 && anchorY - y > showDistance) setHidden(false);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (ref?.current?.contains(event.target as Node)) {
        pressed = true;
        setHidden(false);
      }
    };
    const onPointerUp = () => {
      if (!pressed) return;
      pressed = false;
      settledAt = performance.now();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
    document.addEventListener("pointerup", onPointerUp, { capture: true, passive: true });
    document.addEventListener("pointercancel", onPointerUp, { capture: true, passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerdown", onPointerDown, { capture: true });
      document.removeEventListener("pointerup", onPointerUp, { capture: true });
      document.removeEventListener("pointercancel", onPointerUp, { capture: true });
      if (frame) cancelAnimationFrame(frame);
      setHidden(false);
    };
  }, [enabled, ref, threshold, hideDistance, showDistance]);

  return enabled && hidden;
}
