import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { BookNavigator } from "@/features/navigation/book-navigator";
import { GuidedTour } from "@/features/onboarding/guided-tour";
import { CommandPalette } from "@/features/search/command-palette";
import { AppHeader } from "./app-header";
import { MobileBar } from "./mobile-bar";

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  return (
    <>
      <a
        href="#main"
        className="fixed top-2 left-2 z-100 -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform focus:translate-y-0"
      >
        {t("Common.skipToContent")}
      </a>
      <AppHeader />
      <div className="mx-auto flex w-full max-w-screen-2xl">
        <nav
          aria-label={t("Navigator.label")}
          data-tour="navigator"
          className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 flex-col border-r lg:flex"
        >
          <div className="min-h-0 flex-1 [scrollbar-width:thin] overflow-y-auto overscroll-contain px-3 pb-3">
            <BookNavigator tabsBarClassName="bg-background pt-3" />
          </div>
        </nav>
        <main
          id="main"
          tabIndex={-1}
          className="min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] outline-none lg:pb-0"
        >
          {children}
        </main>
      </div>
      <MobileBar />
      <CommandPalette />
      <GuidedTour />
    </>
  );
}
