"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { hasModifier, isInsideInteractiveWidget } from "@/lib/keyboard";

/** ← / → move between chapters when no widget is using the arrow keys. */
export function ChapterHotkeys({ previous, next }: { previous?: string; next?: string }) {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || hasModifier(event) || isInsideInteractiveWidget(event.target)) {
        return;
      }
      const target =
        event.key === "ArrowLeft" ? previous : event.key === "ArrowRight" ? next : undefined;
      if (!target) return;
      event.preventDefault();
      router.push(target);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [previous, next, router]);

  return null;
}
