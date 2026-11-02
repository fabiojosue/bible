"use client";

import { CheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type BookDefinition, bookName, chapterKey } from "@/features/bible/books";
import { chapterPath } from "@/features/bible/routes";
import { useProgress } from "@/features/progress/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface ChapterGridProps {
  book: BookDefinition;
  activeChapter?: number;
  size?: "sm" | "touch" | "lg";
  onNavigate?: () => void;
  className?: string;
}

const SIZES = {
  sm: "h-8 text-xs",
  touch: "h-11 text-sm",
  lg: "h-12 text-sm",
} as const;

export function ChapterGrid({
  book,
  activeChapter,
  size = "sm",
  onNavigate,
  className,
}: ChapterGridProps) {
  const t = useTranslations();
  const locale = useLocale();
  const hydrated = useHydrated();
  const readChapters = useProgress((state) => state.readChapters);

  return (
    <nav aria-label={t("Navigator.chaptersOf", { book: bookName(book, locale) })}>
      <ol className={cn("grid gap-1", className)}>
        {Array.from({ length: book.chapters }, (_, index) => {
          const chapter = index + 1;
          const isRead = hydrated && !!readChapters[chapterKey(book.id, chapter)];
          const isActive = activeChapter === chapter;
          const label = t("Common.chapter", { number: chapter });
          return (
            <li key={chapter}>
              <Link
                href={chapterPath({ bookId: book.id, chapter }, locale)}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                aria-label={isRead ? `${label}, ${t("Navigator.read")}` : label}
                className={cn(
                  "relative flex items-center justify-center rounded-md border border-transparent font-mono tabular-nums no-underline! transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50",
                  SIZES[size],
                  size === "lg" && "border-border bg-card",
                  isRead ? "text-muted-foreground" : "text-foreground",
                  isActive &&
                    "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {chapter}
                {isRead && !isActive && (
                  <CheckIcon
                    aria-hidden
                    className="absolute top-0.5 right-0.5 size-2.5 text-chart-1"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
