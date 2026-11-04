"use client";

import { ArrowRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { adjacentChapter, chapterKey } from "@/features/bible/books";
import { formatReference } from "@/features/bible/reference";
import { chapterPath, PAGE_PATHS } from "@/features/bible/routes";
import type { Reference } from "@/features/bible/types";
import { useHydrated } from "@/hooks/use-hydrated";
import { Link } from "@/i18n/navigation";
import { useProgress } from "./store";

function SuggestionCard({ href, title, hint }: { href: string; title: string; hint: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex h-full items-center justify-between gap-4 rounded-xl border bg-card p-5 transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="grid gap-1">
          <span className="font-medium">{title}</span>
          <span className="text-sm text-muted-foreground">{hint}</span>
        </span>
        <ArrowRightIcon
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  );
}

/** The most recently finished chapter, then the next one the reader hasn't finished. */
function upNext(readChapters: Readonly<Record<string, number>>): Reference | undefined {
  let latestKey: string | undefined;
  let latestAt = 0;
  for (const [key, at] of Object.entries(readChapters)) {
    if (at >= latestAt) {
      latestAt = at;
      latestKey = key;
    }
  }
  if (!latestKey) return undefined;
  const [bookId, chapter] = latestKey.split(".");
  let cursor = adjacentChapter({ bookId: bookId!, chapter: Number(chapter) }, 1);
  for (let guard = 0; cursor && guard < 1200; guard++) {
    if (!readChapters[chapterKey(cursor.bookId, cursor.chapter)]) return cursor;
    cursor = adjacentChapter(cursor, 1);
  }
  return undefined;
}

/**
 * "Where to begin" until the first chapter is finished, then the next unread
 * chapter and the saved verses.
 */
export function HomeSuggestions() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const hydrated = useHydrated();
  const readChapters = useProgress((state) => state.readChapters);
  const savedCount = useProgress(
    (state) => Object.values(state.verses).filter((save) => save.saved).length,
  );

  if (!hydrated) return <Skeleton className="h-36 w-full rounded-xl" />;

  const readCount = Object.keys(readChapters).length;
  if (readCount === 0) {
    const starts = [
      {
        href: chapterPath({ bookId: "GEN", chapter: 1 }, locale),
        title: t("startGenesis"),
        hint: t("startGenesisHint"),
      },
      {
        href: chapterPath({ bookId: "JHN", chapter: 1 }, locale),
        title: t("startJohn"),
        hint: t("startJohnHint"),
      },
    ];
    return (
      <section aria-labelledby="start-title" className="grid gap-3">
        <h2 id="start-title" className="text-sm font-medium text-muted-foreground">
          {t("startTitle")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {starts.map((start) => (
            <SuggestionCard key={start.href} {...start} />
          ))}
        </ul>
      </section>
    );
  }

  const next = upNext(readChapters);
  return (
    <section aria-labelledby="start-title" className="grid gap-3">
      <h2 id="start-title" className="text-sm font-medium text-muted-foreground">
        {next ? t("upNextTitle") : t("savedTitle")}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {next && (
          <SuggestionCard
            href={chapterPath(next, locale)}
            title={formatReference(next, locale)}
            hint={t("upNextHint")}
          />
        )}
        <SuggestionCard
          href={PAGE_PATHS.saved}
          title={t("savedTitle")}
          hint={savedCount > 0 ? t("savedCount", { count: savedCount }) : t("savedEmpty")}
        />
      </ul>
    </section>
  );
}
