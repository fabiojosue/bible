import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  adjacentChapter,
  BOOKS,
  type BookDefinition,
  bookSlug,
  getBookBySlug,
} from "@/features/bible/books";
import { getChapter } from "@/features/bible/data";
import { formatReference } from "@/features/bible/reference";
import { bookPath, chapterPath } from "@/features/bible/routes";
import { translationForLocale } from "@/features/bible/translations";
import type { Reference } from "@/features/bible/types";
import { ChapterHotkeys } from "@/features/reader/chapter-hotkeys";
import { ChapterText } from "@/features/reader/chapter-text";
import { MarkReadToggle } from "@/features/reader/mark-read-toggle";
import { ChapterBody } from "@/features/reader/parallel-chapter";
import { ReadingTracker } from "@/features/reader/reading-tracker";
import { getPathname, Link } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";

type Props = PageProps<"/[locale]/[book]/[chapter]">;
export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  return BOOKS.flatMap((book) =>
    Array.from({ length: book.chapters }, (_, index) => ({
      book: bookSlug(book, locale),
      chapter: String(index + 1),
    })),
  );
}

async function resolve(params: Props["params"]) {
  const { locale, book: slug, chapter: chapterParam } = await params;
  if (!hasLocale(routing.locales, locale)) return undefined;
  const book = getBookBySlug(slug, locale);
  const chapter = Number(chapterParam);
  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    return undefined;
  }
  return { locale, book, chapter };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await resolve(params);
  if (!resolved) return {};
  const { locale, book, chapter } = resolved;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const reference = { bookId: book.id, chapter };
  const languages = Object.fromEntries(
    routing.locales.map((target) => [
      target,
      getPathname({ href: chapterPath(reference, target), locale: target }),
    ]),
  );
  return {
    title: t("chapterTitle", {
      reference: formatReference(reference, locale),
      translation: translationForLocale(locale).abbreviation,
    }),
    alternates: { canonical: languages[locale], languages },
  };
}

function ChapterLink({
  target,
  direction,
  locale,
  label,
}: {
  target: Reference | undefined;
  direction: "previous" | "next";
  locale: Locale;
  label: string;
}) {
  const Icon = direction === "previous" ? ChevronLeftIcon : ChevronRightIcon;
  if (!target) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label={label}>
        <Icon />
      </Button>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" asChild>
          <Link href={chapterPath(target, locale)} aria-label={label}>
            <Icon />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {formatReference(target, locale)} <Kbd>{direction === "previous" ? "←" : "→"}</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}

function FooterLink({
  target,
  direction,
  locale,
  label,
}: {
  target: Reference;
  direction: "previous" | "next";
  locale: Locale;
  label: string;
}) {
  const isNext = direction === "next";
  return (
    <Link
      href={chapterPath(target, locale)}
      className={`group flex min-h-16 flex-1 flex-col justify-center gap-0.5 rounded-xl border bg-card px-4 py-3 transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 ${isNext ? "items-end text-right" : "items-start"}`}
    >
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {!isNext && <ChevronLeftIcon aria-hidden className="size-3.5" />}
        {label}
        {isNext && <ChevronRightIcon aria-hidden className="size-3.5" />}
      </span>
      <span className="font-medium">{formatReference(target, locale)}</span>
    </Link>
  );
}

function otherTranslation(locale: Locale) {
  return translationForLocale(locale === "en" ? "es" : "en");
}

export default async function ChapterPage({ params }: Props) {
  const resolved = await resolve(params);
  if (!resolved) notFound();
  const { locale, book, chapter } = resolved;
  setRequestLocale(locale);

  const translation = translationForLocale(locale);
  const content = await getChapter(translation.id, book.id, chapter);
  if (!content) notFound();

  const t = await getTranslations();
  const reference = { bookId: book.id, chapter };
  const previous = adjacentChapter(reference, -1);
  const next = adjacentChapter(reference, 1);
  const title = formatReference(reference, locale);
  // Unique per chapter: hidden, previously visited pages stay in the DOM.
  const titleId = `title-${locale}-${book.id}-${chapter}`;

  return (
    <article aria-labelledby={titleId} className="px-5 pt-6 pb-12 sm:px-8 lg:pt-10">
      <ChapterHeader
        titleId={titleId}
        book={book}
        locale={locale}
        title={title}
        abbreviation={translation.abbreviation}
        previous={previous}
        next={next}
        labels={{ previous: t("Common.previousChapter"), next: t("Common.nextChapter") }}
      />

      <ReadingTracker bookId={book.id} chapter={chapter} className="mx-auto max-w-5xl">
        <ChapterBody
          bookId={book.id}
          chapter={chapter}
          primary={translation.id}
          secondary={otherTranslation(locale).id}
        >
          <ChapterText verses={content.verses} />
        </ChapterBody>
      </ReadingTracker>
      <ChapterHotkeys
        previous={previous && chapterPath(previous, locale)}
        next={next && chapterPath(next, locale)}
      />

      <footer className="reader-measure mx-auto mt-12 grid gap-6">
        <div className="flex justify-center">
          <MarkReadToggle bookId={book.id} chapter={chapter} />
        </div>
        <nav aria-label={t("Reader.chapterNavigation")} className="flex flex-col gap-3 sm:flex-row">
          {previous && (
            <FooterLink
              target={previous}
              direction="previous"
              locale={locale}
              label={t("Common.previousChapter")}
            />
          )}
          {next && (
            <FooterLink
              target={next}
              direction="next"
              locale={locale}
              label={t("Common.nextChapter")}
            />
          )}
        </nav>
        <p className="text-center text-xs text-muted-foreground">
          <a
            href={translation.sourceUrl}
            className="underline-offset-4 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t("Reader.attribution", { translation: translation.name })}
          </a>
        </p>
      </footer>
    </article>
  );
}

function ChapterHeader({
  titleId,
  book,
  locale,
  title,
  abbreviation,
  previous,
  next,
  labels,
}: {
  titleId: string;
  book: BookDefinition;
  locale: Locale;
  title: string;
  abbreviation: string;
  previous?: Reference;
  next?: Reference;
  labels: { previous: string; next: string };
}) {
  return (
    <header className="reader-measure mx-auto mb-8 flex items-end justify-between gap-4 border-b pb-5">
      <div className="min-w-0">
        <Link
          href={bookPath(book, locale)}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {book.names[locale]}
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 id={titleId} className="text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <Badge variant="outline" className="font-mono text-[0.65rem] font-normal">
            {abbreviation}
          </Badge>
        </div>
      </div>
      <div className="hidden items-center gap-1 lg:flex" data-tour="chapter-nav">
        <ChapterLink
          target={previous}
          direction="previous"
          locale={locale}
          label={labels.previous}
        />
        <ChapterLink target={next} direction="next" locale={locale} label={labels.next} />
      </div>
    </header>
  );
}
