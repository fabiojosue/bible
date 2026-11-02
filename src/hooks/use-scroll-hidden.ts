import { useEffect, useState } from "react";

/**
 * True while the user scrolls down past `threshold`; false on scroll up or near
 * the top/bottom of the page. Used to tuck mobile chrome away while reading.
 */
export function useScrollHidden({ enabled = true, threshold = 80, tolerance = 8 } = {}): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 40;
      if (y < threshold || nearBottom) setHidden(false);
      else if (y - lastY > tolerance) setHidden(true);
      else if (lastY - y > tolerance) setHidden(false);
      if (Math.abs(y - lastY) > tolerance) lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      setHidden(false);
    };
  }, [enabled, threshold, tolerance]);

  return enabled && hidden;
}
