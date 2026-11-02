import { ArrowRightIcon } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { BOOKS, bookName, type Testament } from "@/features/bible/books";
import { bookPath, chapterPath } from "@/features/bible/routes";
import { translationForLocale } from "@/features/bible/translations";
import {
  BookReadCount,
  ContinueReading,
  OverallProgress,
} from "@/features/progress/progress-widgets";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const TESTAMENTS: readonly Testament[] = ["old", "new"];

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const translation = translationForLocale(locale);

  const starts = [
    {
      href: chapterPath({ bookId: "GEN", chapter: 1 }, locale),
      title: t("Home.startGenesis"),
      hint: t("Home.startGenesisHint"),
    },
    {
      href: chapterPath({ bookId: "JHN", chapter: 1 }, locale),
      title: t("Home.startJohn"),
      hint: t("Home.startJohnHint"),
    },
  ];

  return (
    <div className="mx-auto grid max-w-4xl gap-12 px-5 py-10 sm:px-8 lg:py-16">
      <header className="grid gap-3">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          {translation.name}
        </p>
        <h1 className="text-4xl font-semibold tracking-tighter sm:text-5xl">{t("Home.title")}</h1>
        <p className="max-w-prose text-pretty text-muted-foreground">{t("Home.subtitle")}</p>
      </header>

      <ContinueReading />

      <section aria-labelledby="start-title" className="grid gap-3">
        <h2 id="start-title" className="text-sm font-medium text-muted-foreground">
          {t("Home.startTitle")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {starts.map((start) => (
            <li key={start.href}>
              <Link
                href={start.href}
                className="group flex h-full items-center justify-between gap-4 rounded-xl border bg-card p-5 transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="grid gap-1">
                  <span className="font-medium">{start.title}</span>
                  <span className="text-sm text-muted-foreground">{start.hint}</span>
                </span>
                <ArrowRightIcon
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="progress-title" className="grid gap-3">
        <h2 id="progress-title" className="text-sm font-medium text-muted-foreground">
          {t("Home.yourProgress")}
        </h2>
        <OverallProgress />
      </section>

      <section aria-labelledby="books-title" className="grid gap-6">
        <h2 id="books-title" className="text-sm font-medium text-muted-foreground">
          {t("Home.allBooks")}
        </h2>
        {TESTAMENTS.map((testament) => (
          <div key={testament} className="grid gap-3">
            <h3 className="text-lg font-semibold tracking-tight">
              {t(testament === "old" ? "Common.oldTestament" : "Common.newTestament")}
            </h3>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {BOOKS.filter((book) => book.testament === testament).map((book) => (
                <li key={book.id}>
                  <Link
                    href={bookPath(book, locale)}
                    className="relative flex min-h-12 flex-col justify-center rounded-lg border bg-card px-3 py-2 text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className="truncate font-medium">{bookName(book, locale)}</span>
                    <span className="text-xs text-muted-foreground">
                      {t("Common.chapters", { count: book.chapters })}
                    </span>
                    <BookReadCount book={book} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
