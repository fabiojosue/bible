"use client";

import { ChevronLeftIcon, ChevronRightIcon, LibraryIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { adjacentChapter } from "@/features/bible/books";
import { formatReference } from "@/features/bible/reference";
import { chapterPath } from "@/features/bible/routes";
import { useCurrentLocation } from "@/features/bible/use-current-location";
import { BookNavigator } from "@/features/navigation/book-navigator";
import { useOnboarding } from "@/features/onboarding/store";
import { SettingsDrawer } from "@/features/settings/settings-triggers";
import { useScrollHidden } from "@/hooks/use-scroll-hidden";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const itemClass = "flex-col gap-0.5 text-[0.7rem] font-normal text-muted-foreground";

/** Thumb-reachable navigation for small screens; replaced by the sidebar on desktop. */
export function MobileBar() {
  const t = useTranslations();
  const locale = useLocale();
  const location = useCurrentLocation();
  const tourOpen = useOnboarding((state) => state.open);
  const [booksOpen, setBooksOpen] = useState(false);
  const hidden = useScrollHidden({ enabled: !!location?.chapter && !tourOpen && !booksOpen });

  const current =
    location?.chapter !== undefined
      ? { bookId: location.book.id, chapter: location.chapter }
      : undefined;
  const previous = current && adjacentChapter(current, -1);
  const next = current && adjacentChapter(current, 1);

  return (
    <nav
      aria-label={t("Header.primaryNavigation")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-transform duration-200 lg:hidden",
        hidden && "translate-y-full focus-within:translate-y-0",
      )}
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {current && (
          <Button
            asChild={!!previous}
            disabled={!previous}
            variant="ghost"
            size="icon-touch"
            aria-label={t("Common.previousChapter")}
          >
            {previous ? (
              <Link href={chapterPath(previous, locale)}>
                <ChevronLeftIcon />
              </Link>
            ) : (
              <ChevronLeftIcon />
            )}
          </Button>
        )}

        <Drawer open={booksOpen} onOpenChange={setBooksOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="touch"
              className={cn(itemClass, "max-w-40 min-w-24")}
              aria-label={
                current
                  ? `${t("Header.openBooks")}: ${formatReference(current, locale)}`
                  : t("Header.openBooks")
              }
              data-tour="navigator"
            >
              <LibraryIcon aria-hidden />
              <span className="max-w-full truncate">
                {current ? formatReference(current, locale) : t("Header.books")}
              </span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85dvh]!">
            <DrawerHeader className="pb-2">
              <DrawerTitle>{t("Navigator.label")}</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <BookNavigator
                touch
                tabsBarClassName="bg-popover"
                onNavigate={() => setBooksOpen(false)}
              />
            </div>
          </DrawerContent>
        </Drawer>

        <SettingsDrawer label={t("Header.settingsShort")} />

        {current && (
          <Button
            asChild={!!next}
            disabled={!next}
            variant="ghost"
            size="icon-touch"
            aria-label={t("Common.nextChapter")}
            data-tour="chapter-nav"
          >
            {next ? (
              <Link href={chapterPath(next, locale)}>
                <ChevronRightIcon />
              </Link>
            ) : (
              <ChevronRightIcon />
            )}
          </Button>
        )}
      </div>
    </nav>
  );
}
