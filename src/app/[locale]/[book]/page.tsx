import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BOOKS, bookName, bookSlug, getBookBySlug } from "@/features/bible/books";
import { bookPath } from "@/features/bible/routes";
import { ChapterGrid } from "@/features/navigation/chapter-grid";
import { BookStartButton } from "@/features/progress/progress-widgets";
import { getPathname } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";

type Props = PageProps<"/[locale]/[book]">;
export function generateStaticParams({ params }: { params: { locale: string } }) {
  return BOOKS.map((book) => ({ book: bookSlug(book, params.locale as Locale) }));
}

async function resolve(params: Props["params"]) {
  const { locale, book: slug } = await params;
  if (!hasLocale(routing.locales, locale)) return undefined;
  const book = getBookBySlug(slug, locale);
  return book ? { locale, book } : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await resolve(params);
  if (!resolved) return {};
  const { locale, book } = resolved;
  const languages = Object.fromEntries(
    routing.locales.map((target) => [
      target,
      getPathname({ href: bookPath(book, target), locale: target }),
    ]),
  );
  return { title: bookName(book, locale), alternates: { canonical: languages[locale], languages } };
}

export default async function BookPage({ params }: Props) {
  const resolved = await resolve(params);
  if (!resolved) notFound();
  const { locale, book } = resolved;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:py-12">
      <header className="mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {t(book.testament === "old" ? "Common.oldTestament" : "Common.newTestament")}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{bookName(book, locale)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Common.chapters", { count: book.chapters })}
          </p>
        </div>
        <BookStartButton book={book} />
      </header>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        {t("Book.chaptersHeading")}
      </h2>
      <ChapterGrid book={book} size="lg" className="grid-cols-5 sm:grid-cols-8 md:grid-cols-10" />
    </div>
  );
}
