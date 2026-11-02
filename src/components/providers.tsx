"use client";

import { ThemeProvider } from "next-themes";
import { type ReactNode, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { applyReaderSettings } from "@/features/settings/reader-settings";
import { useSettings } from "@/features/settings/store";

function ReaderSettingsSync() {
  useEffect(() => {
    // Signals that client handlers are attached (used by end-to-end tests).
    document.documentElement.dataset.hydrated = "true";
    applyReaderSettings(useSettings.getState(), document.documentElement);
    return useSettings.subscribe((settings) =>
      applyReaderSettings(settings, document.documentElement),
    );
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={300}>
        <ReaderSettingsSync />
        {children}
        <Toaster position="top-center" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
