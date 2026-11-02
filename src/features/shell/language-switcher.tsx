"use client";

import { CheckIcon, LanguagesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { localizePath, parsePath, verseAnchor } from "@/features/bible/routes";
import { useProgress } from "@/features/progress/store";
import { Link, usePathname } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Switches language while staying on the same chapter (and verse, when known). */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const lastPosition = useProgress((state) => state.lastPosition);

  const current = parsePath(pathname, locale);
  const keepVerse =
    current?.chapter &&
    lastPosition?.bookId === current.book.id &&
    lastPosition.chapter === current.chapter &&
    lastPosition.verse > 1;

  const hrefFor = (target: Locale) => {
    const path = localizePath(pathname, locale, target);
    return keepVerse ? `${path}#${verseAnchor(lastPosition.verse)}` : path;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("gap-1.5 px-2 font-mono text-xs", className)}
          data-tour="language"
        >
          <LanguagesIcon aria-hidden />
          <span className="sr-only">{t("Header.language")}: </span>
          {locale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {routing.locales.map((target) => (
          <DropdownMenuItem key={target} asChild className="min-h-10 sm:min-h-8">
            <Link
              href={hrefFor(target)}
              locale={target}
              lang={target}
              hrefLang={target}
              aria-current={target === locale ? "true" : undefined}
            >
              {t(`Language.${target}`)}
              {target === locale && <CheckIcon aria-hidden className="ml-auto" />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
