"use client";

import { BookmarkIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { verseKey } from "@/features/bible/books";
import { formatReference } from "@/features/bible/reference";
import { chapterPath } from "@/features/bible/routes";
import { translationForLocale } from "@/features/bible/translations";
import { useProgress } from "@/features/progress/store";
import { renderStoryImage } from "./story-image";

function WhatsAppIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5">
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.4a10 10 0 0 0 4.65 1.14h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2m5.8 13.88c-.24.68-1.4 1.3-1.94 1.34-.5.04-1.12.06-1.81-.11-.41-.1-.95-.31-1.64-.61-2.88-1.25-4.76-4.16-4.9-4.35-.14-.2-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.24-.28.64-.41 1.02-.41.12 0 .23 0 .33.01.3.01.44.03.64.49.24.58.82 2 .89 2.15.07.14.12.31.02.5-.1.18-.14.3-.28.46-.14.16-.3.36-.42.48-.14.14-.28.29-.12.56.16.27.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.14.42.12.58-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.1 1.54.73 1.8.86.27.13.44.2.5.31.07.11.07.64-.17 1.32"
      />
    </svg>
  );
}

function InstagramIcon() {
  const gradientId = `ig-${useId().replace(/:/g, "")}`;
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5">
      <defs>
        <radialGradient id={gradientId} cx="30%" cy="110%" r="140%">
          <stop offset="0%" stopColor="#f9ce34" />
          <stop offset="45%" stopColor="#ee2a7b" />
          <stop offset="100%" stopColor="#6228d7" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill={`url(#${gradientId})`} />
      <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="1.6" />
      <circle cx="17.3" cy="6.7" r="1" fill="white" />
    </svg>
  );
}

/**
 * Opens after the verse has been highlighted: the verse itself, then save,
 * WhatsApp, and an Instagram story image.
 */
export function VerseActions({
  open,
  bookId,
  chapter,
  verse,
  text,
  onClose,
}: {
  open: boolean;
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
  onClose: () => void;
}) {
  const t = useTranslations("Verse");
  const locale = useLocale();
  const key = verseKey(bookId, chapter, verse);
  const saved = useProgress((state) => !!state.verses[key]?.saved);
  const [storyPending, setStoryPending] = useState(false);
  const reference = formatReference({ bookId, chapter, verse }, locale);

  const onSave = () => {
    useProgress.getState().setVerseSaved(key, !saved, {
      text,
      translation: translationForLocale(locale).id,
    });
  };

  const onWhatsApp = () => {
    const url = `${window.location.origin}/${locale}${chapterPath({ bookId, chapter, verse }, locale)}`;
    const message = `${reference}\n${text}\n${url}`;
    const opened = window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
    if (!opened) toast.error(t("popupBlocked"));
  };

  const onStory = async () => {
    setStoryPending(true);
    try {
      const blob = await renderStoryImage({ reference, text, footer: t("storyFooter") });
      const file = new File([blob], `${bookId.toLowerCase()}-${chapter}-${verse}.png`, {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: reference });
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(objectUrl);
        toast.success(t("storySaved"));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(t("storyFailed"));
    } finally {
      setStoryPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md" closeLabel={t("close")}>
        <DialogHeader>
          <DialogTitle>{reference}</DialogTitle>
          <DialogDescription className="pt-1 font-serif text-lg leading-relaxed text-pretty text-foreground">
            {text}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" className="h-16 flex-col gap-1" onClick={onSave}>
            <BookmarkIcon aria-hidden className={saved ? "fill-current" : undefined} />
            {saved ? t("saved") : t("save")}
          </Button>
          <Button variant="outline" className="h-16 flex-col gap-1" onClick={onWhatsApp}>
            <WhatsAppIcon />
            {t("whatsapp")}
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-1"
            onClick={() => void onStory()}
            disabled={storyPending}
            aria-busy={storyPending}
          >
            <InstagramIcon />
            {t("story")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
