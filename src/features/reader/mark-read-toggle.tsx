"use client";

import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { chapterKey } from "@/features/bible/books";
import { useProgress } from "@/features/progress/store";
import { useHydrated } from "@/hooks/use-hydrated";

export function MarkReadToggle({ bookId, chapter }: { bookId: string; chapter: number }) {
  const t = useTranslations("Reader");
  const hydrated = useHydrated();
  const isRead = useProgress((state) => !!state.readChapters[chapterKey(bookId, chapter)]);
  const setRead = useProgress((state) => state.setRead);
  const read = hydrated && isRead;

  return (
    <Button
      variant={read ? "secondary" : "outline"}
      className="h-11 gap-2 px-4 sm:h-9"
      aria-pressed={read}
      onClick={() => setRead(bookId, chapter, !read)}
    >
      {read ? (
        <CheckCircle2Icon className="text-chart-1" aria-hidden />
      ) : (
        <CircleIcon aria-hidden />
      )}
      {t("markRead")}
    </Button>
  );
}
