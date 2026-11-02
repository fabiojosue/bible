"use client";

import { ArrowRightIcon, BookmarkIcon } from "lucide-react";
import { useFormatter, useLocale, useNow, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { type BookDefinition, chapterKey, TOTAL_CHAPTERS } from "@/features/bible/books";
import { formatReference } from "@/features/bible/reference";
import { chapterPath } from "@/features/bible/routes";
import { useHydrated } from "@/hooks/use-hydrated";
import { Link } from "@/i18n/navigation";
import { countReadInBook, useProgress } from "./store";

export function OverallProgress() {
  const t = useTranslations("Progress");
  const format = useFormatter();
  const hydrated = useHydrated();
  const read = useProgress((state) => Object.keys(state.readChapters).length);
  // One decimal, rounded up so the first chapter read shows 0.1% rather than 0%.
  const percent = Math.min(100, Math.ceil((read / TOTAL_CHAPTERS) * 1000) / 10);

  if (!hydrated) return <Skeleton className="h-12 w-full" />;
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span>
          {t("overall", { read: format.number(read), total: format.number(TOTAL_CHAPTERS) })}
        </span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {t("percent", { percent })}
        </span>
      </div>
      <Progress value={percent} aria-label={t("overall", { read, total: TOTAL_CHAPTERS })} />
    </div>
  );
}

export function BookReadCount({ book }: { book: BookDefinition }) {
  const t = useTranslations("Progress");
  const hydrated = useHydrated();
  const read = useProgress((state) => countReadInBook(state.readChapters, book.id, book.chapters));
  if (!hydrated || read === 0) return null;
  return (
    <>
      <Progress
        value={(read / book.chapters) * 100}
        aria-hidden
        className="absolute inset-x-3 bottom-2 h-0.5 w-auto"
      />
      <span className="sr-only">, {t("bookProgress", { read, total: book.chapters })}</span>
    </>
  );
}

/** Rendered only on the client: reading the clock during prerender would freeze it into the HTML. */
function LastReadTime({ updatedAt }: { updatedAt: number }) {
  const t = useTranslations("Home");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  return <>{t("lastRead", { time: format.relativeTime(updatedAt, now) })}</>;
}

export function ContinueReading() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const hydrated = useHydrated();
  const lastPosition = useProgress((state) => state.lastPosition);

  if (!hydrated) return <Skeleton className="h-28 w-full rounded-xl" />;
  if (!lastPosition) return null;

  return (
    <section
      aria-labelledby="continue-title"
      data-tour="progress"
      className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-lg border bg-background"
          aria-hidden
        >
          <BookmarkIcon className="size-4" />
        </span>
        <div>
          <h2 id="continue-title" className="text-sm text-muted-foreground">
            {t("continueTitle")}
          </h2>
          <p className="text-lg font-semibold tracking-tight">
            {formatReference(lastPosition, locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            <LastReadTime updatedAt={lastPosition.updatedAt} />
          </p>
        </div>
      </div>
      <Button asChild className="h-11 gap-2 sm:h-9">
        <Link href={chapterPath(lastPosition, locale)}>
          {t("continueCta")}
          <ArrowRightIcon aria-hidden />
        </Link>
      </Button>
    </section>
  );
}

/** "Start reading" / "Continue at chapter N" for a book overview page. */
export function BookStartButton({ book }: { book: BookDefinition }) {
  const t = useTranslations("Book");
  const locale = useLocale();
  const hydrated = useHydrated();
  const readChapters = useProgress((state) => state.readChapters);
  const lastPosition = useProgress((state) => state.lastPosition);

  let target = { bookId: book.id, chapter: 1, verse: undefined as number | undefined };
  if (hydrated && lastPosition?.bookId === book.id) {
    target = lastPosition;
  } else if (hydrated) {
    const firstUnread = Array.from({ length: book.chapters }, (_, i) => i + 1).find(
      (chapter) => !readChapters[chapterKey(book.id, chapter)],
    );
    if (firstUnread && firstUnread > 1)
      target = { bookId: book.id, chapter: firstUnread, verse: undefined };
  }

  return (
    <Button asChild className="h-11 gap-2 sm:h-9">
      <Link href={chapterPath(target, locale)}>
        {target.chapter > 1 || target.verse
          ? t("continue", { chapter: target.chapter })
          : t("start")}
        <ArrowRightIcon aria-hidden />
      </Link>
    </Button>
  );
}
