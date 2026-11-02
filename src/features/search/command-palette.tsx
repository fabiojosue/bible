"use client";

import {
  ArrowRightIcon,
  BookOpenIcon,
  BookmarkIcon,
  ColumnsIcon,
  CompassIcon,
  LanguagesIcon,
  SunMoonIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { bookName, normalize } from "@/features/bible/books";
import { formatReference, parseQuery, searchBooks } from "@/features/bible/reference";
import { bookPath, chapterPath } from "@/features/bible/routes";
import type { Reference } from "@/features/bible/types";
import { useOnboarding } from "@/features/onboarding/store";
import { useProgress } from "@/features/progress/store";
import { requestVerseFocus } from "@/features/reader/verse-focus";
import { useSettings } from "@/features/settings/store";
import { useLocaleHref } from "@/features/shell/use-locale-href";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { isInsideInteractiveWidget } from "@/lib/keyboard";
import { useCommandPalette } from "./store";

interface Action {
  id: string;
  label: string;
  icon: ReactNode;
  run: () => void;
}

export function CommandPalette() {
  const t = useTranslations("Search");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { open, setOpen, toggle } = useCommandPalette();
  const lastPosition = useProgress((state) => state.lastPosition);
  const toggleParallel = useSettings((state) => state.toggleParallel);
  const startTour = useOnboarding((state) => state.start);
  const localeHrefFor = useLocaleHref();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggle();
      } else if (event.key === "/" && !isInsideInteractiveWidget(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen, toggle]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const goTo = (reference: Reference) => {
    close();
    const target = chapterPath({ ...reference, verse: undefined }, locale);
    router.push(chapterPath(reference, locale));
    if (reference.verse && target === pathname) requestVerseFocus(reference.verse);
  };

  const parsed = useMemo(() => parseQuery(query, locale), [query, locale]);
  const books = useMemo(
    () => (query.trim() ? searchBooks(query, locale).slice(0, 8) : []),
    [query, locale],
  );

  const otherLocale: Locale = locale === "en" ? "es" : "en";
  const actions: Action[] = [
    ...(lastPosition
      ? [
          {
            id: "continue",
            label: `${t("continue")}: ${formatReference(lastPosition, locale)}`,
            icon: <BookmarkIcon />,
            run: () => goTo(lastPosition),
          },
        ]
      : []),
    {
      id: "parallel",
      label: t("toggleParallel"),
      icon: <ColumnsIcon />,
      run: () => {
        toggleParallel();
        close();
      },
    },
    {
      id: "language",
      label: t("switchLanguage"),
      icon: <LanguagesIcon />,
      run: () => {
        close();
        window.location.assign(localeHrefFor(otherLocale));
      },
    },
    {
      id: "theme",
      label: t("toggleTheme"),
      icon: <SunMoonIcon />,
      run: () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        close();
      },
    },
    {
      id: "tour",
      label: t("replayTour"),
      icon: <CompassIcon />,
      run: () => {
        close();
        startTour();
      },
    },
  ];
  const normalizedQuery = normalize(query);
  const visibleActions = normalizedQuery
    ? actions.filter((action) => normalize(action.label).includes(normalizedQuery))
    : actions;

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      title={t("title")}
      description={t("description")}
      className="top-4 sm:top-1/4 sm:max-w-lg"
    >
      {/* Matching is done by our reference parser, so cmdk's fuzzy filter is disabled. */}
      <Command shouldFilter={false} loop>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={t("placeholder")}
          aria-label={t("title")}
          className="text-base sm:text-sm"
        />
        <CommandList className="max-h-[min(24rem,60dvh)]">
          <CommandEmpty>{t("empty")}</CommandEmpty>
          {parsed && (
            <CommandGroup heading={t("goTo")}>
              <CommandItem
                value={`goto-${parsed.book.id}-${parsed.chapter ?? 0}-${parsed.verse ?? 0}`}
                onSelect={() => {
                  if (parsed.chapter) {
                    goTo({ bookId: parsed.book.id, chapter: parsed.chapter, verse: parsed.verse });
                  } else {
                    close();
                    router.push(bookPath(parsed.book, locale));
                  }
                }}
              >
                <ArrowRightIcon />
                {parsed.chapter
                  ? formatReference(
                      { bookId: parsed.book.id, chapter: parsed.chapter, verse: parsed.verse },
                      locale,
                    )
                  : bookName(parsed.book, locale)}
                <CommandShortcut>
                  <Kbd>↵</Kbd>
                </CommandShortcut>
              </CommandItem>
            </CommandGroup>
          )}
          {books.length > 0 && (
            <CommandGroup heading={t("books")}>
              {books.map((book) => (
                <CommandItem
                  key={book.id}
                  value={`book-${book.id}`}
                  onSelect={() => {
                    close();
                    router.push(bookPath(book, locale));
                  }}
                >
                  <BookOpenIcon />
                  <span>{bookName(book, locale)}</span>
                  <CommandShortcut className="tracking-normal" lang={otherLocale}>
                    {bookName(book, otherLocale)}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {visibleActions.length > 0 && (
            <CommandGroup heading={t("actions")}>
              {visibleActions.map((action) => (
                <CommandItem key={action.id} value={`action-${action.id}`} onSelect={action.run}>
                  {action.icon}
                  {action.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
