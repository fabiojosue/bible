"use client";

import { useTranslations } from "next-intl";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { findTourTarget, TOUR_STEPS, type TourStep } from "./steps";
import { useOnboarding } from "./store";

const AUTO_START_DELAY = 800;
const GAP = 14;
const MARGIN = 12;
const SPOTLIGHT_PADDING = 6;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Positions the card next to the spotlight without leaving the viewport. */
function placeCard(target: DOMRect | undefined, card: { width: number; height: number }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const maxTop = Math.max(MARGIN, vh - card.height - MARGIN);

  if (!target) {
    return { top: (vh - card.height) / 2, left: (vw - card.width) / 2 };
  }
  if (vw < 640) {
    // Phones: dock to whichever half of the screen the target isn't in.
    const targetBelowMiddle = target.top + target.height / 2 > vh / 2;
    const top = targetBelowMiddle ? target.top - card.height - GAP : target.bottom + GAP;
    return { top: clamp(top, MARGIN, maxTop), left: MARGIN };
  }
  const centeredLeft = clamp(
    target.left + target.width / 2 - card.width / 2,
    MARGIN,
    vw - card.width - MARGIN,
  );
  if (target.bottom + GAP + card.height <= vh - MARGIN) {
    return { top: target.bottom + GAP, left: centeredLeft };
  }
  if (target.top - GAP - card.height >= MARGIN) {
    return { top: target.top - GAP - card.height, left: centeredLeft };
  }
  // Tall targets such as the sidebar: sit beside them.
  return {
    top: clamp(target.top + GAP * 2, MARGIN, maxTop),
    left: clamp(target.right + GAP, MARGIN, vw - card.width - MARGIN),
  };
}

export function GuidedTour() {
  const hydrated = useHydrated();
  const { open, completedAt, start } = useOnboarding();

  useEffect(() => {
    if (!hydrated || completedAt !== null || open) return;
    const timer = window.setTimeout(start, AUTO_START_DELAY);
    return () => window.clearTimeout(timer);
    // Only auto-start once per page load for first-time visitors.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  return open ? <TourDialog /> : null;
}

function TourDialog() {
  const t = useTranslations("Tour");
  const finish = useOnboarding((state) => state.finish);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const steps = useMemo<TourStep[]>(
    () => TOUR_STEPS.filter((step) => !step.requiresTarget || findTourTarget(step.target!)),
    [],
  );
  const [index, setIndex] = useState(0);
  const step = steps[index] ?? steps[0]!;
  const isLast = index === steps.length - 1;

  const [spotlight, setSpotlight] = useState<DOMRect>();
  const [cardPosition, setCardPosition] = useState({ top: -9999, left: -9999 });
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  const measure = useCallback(() => {
    const element = step.target ? findTourTarget(step.target) : undefined;
    const rect = element?.getBoundingClientRect();
    setSpotlight(rect);
    const card = cardRef.current;
    if (card)
      setCardPosition(placeCard(rect, { width: card.offsetWidth, height: card.offsetHeight }));
  }, [step]);

  useLayoutEffect(() => {
    const element = step.target ? findTourTarget(step.target) : undefined;
    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        element.scrollIntoView({ block: "center" });
      }
    }
    primaryRef.current?.focus();

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };
    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    const observer = new ResizeObserver(schedule);
    if (cardRef.current) observer.observe(cardRef.current);
    return () => {
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [measure, step]);

  const body = isDesktop && step.bodyDesktop ? step.bodyDesktop : step.body;
  const hole: Box | undefined = spotlight && {
    top: spotlight.top - SPOTLIGHT_PADDING,
    left: spotlight.left - SPOTLIGHT_PADDING,
    width: spotlight.width + SPOTLIGHT_PADDING * 2,
    height: spotlight.height + SPOTLIGHT_PADDING * 2,
  };

  return (
    <DialogPrimitive.Root open onOpenChange={(next) => !next && finish()}>
      <DialogPrimitive.Portal>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none fixed z-50 transition-all duration-300 ease-out",
            hole ? "rounded-xl ring-2 ring-ring dark:bg-white/10" : "inset-0 bg-black/70",
          )}
          style={
            hole && {
              top: hole.top,
              left: hole.left,
              width: hole.width,
              height: hole.height,
              // The glow comes first so it paints over the dimmed page. Dimming
              // alone barely shows on the dark theme, which is already near black.
              boxShadow:
                "0 0 20px 4px color-mix(in oklab, var(--ring) 60%, transparent), 0 0 0 9999px rgb(0 0 0 / 0.7)",
            }
          }
        />
        <DialogPrimitive.Content
          ref={cardRef}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            primaryRef.current?.focus();
          }}
          // Clicking the dimmed page shouldn't silently end the tour.
          onPointerDownOutside={(event) => event.preventDefault()}
          style={{ top: cardPosition.top, left: cardPosition.left }}
          className="fixed z-50 grid w-[calc(100vw-1.5rem)] gap-4 rounded-xl border bg-popover p-5 text-popover-foreground shadow-2xl transition-[top,left] duration-300 ease-out outline-none sm:w-80"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-xs text-muted-foreground tabular-nums">
              {t("step", { current: index + 1, total: steps.length })}
            </p>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="sm" className="-mr-2 h-9 text-muted-foreground sm:h-7">
                {t("skip")}
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className="grid gap-1.5" aria-live="polite">
            <DialogPrimitive.Title className="text-base font-semibold tracking-tight">
              {t(step.title)}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {t(body)}
            </DialogPrimitive.Description>
          </div>
          <div className="flex items-center justify-between gap-3">
            <ol className="flex gap-1.5" aria-hidden>
              {steps.map((item, i) => (
                <li
                  key={item.id}
                  className={cn(
                    "size-1.5 rounded-full bg-muted-foreground/30 transition-colors",
                    i === index && "w-4 bg-foreground",
                  )}
                />
              ))}
            </ol>
            <div className="flex gap-2">
              {index > 0 && (
                <Button variant="ghost" className="h-10 sm:h-8" onClick={() => setIndex(index - 1)}>
                  {t("back")}
                </Button>
              )}
              <Button
                ref={primaryRef}
                className="h-10 sm:h-8"
                onClick={() => (isLast ? finish() : setIndex(index + 1))}
              >
                {isLast ? t("done") : t("next")}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
