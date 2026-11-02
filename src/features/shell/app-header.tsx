"use client";

import { BookOpenIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useCurrentLocation } from "@/features/bible/use-current-location";
import { useOnboarding } from "@/features/onboarding/store";
import { useCommandPalette } from "@/features/search/store";
import { SettingsPopover } from "@/features/settings/settings-triggers";
import { useIsMac } from "@/hooks/use-is-mac";
import { useScrollHidden } from "@/hooks/use-scroll-hidden";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";

export function AppHeader() {
  const t = useTranslations();
  const location = useCurrentLocation();
  const tourOpen = useOnboarding((state) => state.open);
  const openSearch = useCommandPalette((state) => state.setOpen);
  const hidden = useScrollHidden({ enabled: !!location?.chapter && !tourOpen });
  const isMac = useIsMac();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-14 border-b bg-background/85 backdrop-blur-md transition-transform duration-200 supports-backdrop-filter:bg-background/70 lg:translate-y-0",
        hidden && "-translate-y-full focus-within:translate-y-0",
      )}
    >
      <div className="flex h-full items-center gap-1 px-2 sm:px-3 lg:gap-2 lg:px-4">
        <Link
          href="/"
          className="flex h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="grid size-7 place-items-center rounded-md border bg-card" aria-hidden>
            <BookOpenIcon className="size-4" />
          </span>
          {t("Metadata.siteName")}
        </Link>

        <div className="flex flex-1 justify-center px-2">
          <Button
            variant="outline"
            onClick={() => openSearch(true)}
            className="hidden h-9 w-full max-w-sm justify-start gap-2 px-3 font-normal text-muted-foreground lg:flex"
            data-tour="search"
          >
            <SearchIcon aria-hidden />
            <span className="flex-1 text-left">{t("Header.searchPlaceholder")}</span>
            <KbdGroup aria-hidden>
              <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon-touch"
          onClick={() => openSearch(true)}
          aria-label={t("Header.search")}
          className="lg:hidden"
          data-tour="search"
        >
          <SearchIcon />
        </Button>
        <LanguageSwitcher className="h-11 lg:h-8" />
        <div className="hidden lg:block">
          <SettingsPopover />
        </div>
      </div>
    </header>
  );
}
