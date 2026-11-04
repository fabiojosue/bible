"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { parseVerseKey } from "@/features/bible/books";
import { formatReference } from "@/features/bible/reference";
import { chapterPath } from "@/features/bible/routes";
import { useHydrated } from "@/hooks/use-hydrated";
import { Link } from "@/i18n/navigation";
import { useProgress } from "./store";

/** Saved verses, newest first, with a way back to each one. */
export function SavedVerses() {
  const t = useTranslations("Saved");
  const locale = useLocale();
  const hydrated = useHydrated();
  const verses = useProgress((state) => state.verses);

  if (!hydrated) return null;

  const saved = Object.entries(verses)
    .filter(([, save]) => save.saved)
    .sort(([, a], [, b]) => b.at - a.at);

  if (saved.length === 0) {
    return <p className="text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className="grid gap-3">
      {saved.map(([key, save]) => {
        const reference = parseVerseKey(key);
        if (!reference?.verse) return null;
        const label = formatReference(reference, locale);
        return (
          <li key={key} className="grid gap-2 rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <Link
                href={chapterPath(reference, locale)}
                className="font-medium underline-offset-4 outline-none hover:underline focus-visible:underline"
              >
                {label}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 shrink-0 text-muted-foreground"
                aria-label={`${t("remove")} ${label}`}
                onClick={() => useProgress.getState().setVerseSaved(key, false)}
              >
                {t("remove")}
              </Button>
            </div>
            <p className="text-pretty text-muted-foreground">{save.text}</p>
          </li>
        );
      })}
    </ul>
  );
}
