"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BOOKS, type BookDefinition, bookName, type Testament } from "@/features/bible/books";
import { useCurrentLocation } from "@/features/bible/use-current-location";
import { countReadInBook, useProgress } from "@/features/progress/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { ChapterGrid } from "./chapter-grid";

const TESTAMENTS: readonly Testament[] = ["old", "new"];

interface BookNavigatorProps {
  /** Called after a chapter link is activated, e.g. to close a drawer. */
  onNavigate?: () => void;
  /** Larger touch targets for the mobile drawer. */
  touch?: boolean;
  /** Sticky testament tabs bar; needs the scroll container's background to cover scrolled content. */
  tabsBarClassName?: string;
  className?: string;
}

export function BookNavigator({
  onNavigate,
  touch = false,
  tabsBarClassName = "bg-background",
  className,
}: BookNavigatorProps) {
  const t = useTranslations();
  const locale = useLocale();
  const hydrated = useHydrated();
  const readChapters = useProgress((state) => state.readChapters);
  const location = useCurrentLocation();
  const currentBook = location?.book;

  const [testament, setTestament] = useState<Testament>(currentBook?.testament ?? "old");
  const [expanded, setExpanded] = useState(currentBook?.id ?? "");
  const [syncedBookId, setSyncedBookId] = useState(currentBook?.id);
  // Follow the reader to a new book without overriding manual browsing within the same one.
  if (currentBook && currentBook.id !== syncedBookId) {
    setSyncedBookId(currentBook.id);
    setTestament(currentBook.testament);
    setExpanded(currentBook.id);
  }

  const currentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const item = currentRef.current;
    const active = item?.querySelector('[aria-current="page"]') ?? item;
    active?.scrollIntoView({ block: "center" });
  }, [syncedBookId]);

  const renderBook = (book: BookDefinition) => {
    const isCurrent = book.id === currentBook?.id;
    const read = hydrated ? countReadInBook(readChapters, book.id, book.chapters) : 0;
    return (
      <AccordionItem
        key={book.id}
        value={book.id}
        ref={isCurrent ? currentRef : undefined}
        className="border-none"
      >
        <AccordionTrigger
          asHeading={false}
          className={cn(
            "items-center rounded-md px-2 font-normal hover:bg-accent hover:no-underline",
            touch ? "min-h-11 text-base" : "py-1.5",
            isCurrent && "font-medium text-foreground",
          )}
        >
          <span className="flex-1 truncate">{bookName(book, locale)}</span>
          {read > 0 && (
            <span className="mr-1 font-mono text-xs text-muted-foreground tabular-nums">
              <span aria-hidden>
                {read}/{book.chapters}
              </span>
              <span className="sr-only">
                , {t("Progress.bookProgress", { read, total: book.chapters })}
              </span>
            </span>
          )}
        </AccordionTrigger>
        <AccordionContent className="px-1 pt-1 pb-3">
          <ChapterGrid
            book={book}
            activeChapter={isCurrent ? location?.chapter : undefined}
            size={touch ? "touch" : "sm"}
            onNavigate={onNavigate}
            className={touch ? "grid-cols-6 sm:grid-cols-8" : "grid-cols-6"}
          />
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <Tabs
      value={testament}
      onValueChange={(value) => setTestament(value as Testament)}
      className={cn("min-h-0 gap-3", className)}
    >
      <div className={cn("sticky top-0 z-10 -mx-1 px-1 pb-1", tabsBarClassName)}>
        <TabsList className={cn("w-full", touch && "h-11!")}>
          {TESTAMENTS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {t(value === "old" ? "Navigator.oldTab" : "Navigator.newTab")}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {TESTAMENTS.map((value) => (
        <TabsContent key={value} value={value} className="min-h-0">
          <Accordion type="single" collapsible value={expanded} onValueChange={setExpanded}>
            {BOOKS.filter((book) => book.testament === value).map(renderBook)}
          </Accordion>
        </TabsContent>
      ))}
    </Tabs>
  );
}
