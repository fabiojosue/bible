import type { Locale } from "@/i18n/routing";

export interface Translation {
  readonly id: TranslationId;
  readonly name: string;
  readonly abbreviation: string;
  readonly language: Locale;
  readonly year: number;
  readonly sourceUrl: string;
}

export type TranslationId = "web" | "rv1909";

export const TRANSLATIONS: Readonly<Record<TranslationId, Translation>> = {
  web: {
    id: "web",
    name: "World English Bible",
    abbreviation: "WEB",
    language: "en",
    year: 2020,
    sourceUrl: "https://ebible.org/engwebp/",
  },
  rv1909: {
    id: "rv1909",
    name: "Reina-Valera 1909",
    abbreviation: "RV1909",
    language: "es",
    year: 1909,
    sourceUrl: "https://ebible.org/spaRV1909/",
  },
};

export const TRANSLATION_IDS = Object.keys(TRANSLATIONS) as TranslationId[];

const TRANSLATION_BY_LOCALE: Readonly<Record<Locale, TranslationId>> = {
  en: "web",
  es: "rv1909",
};

export function translationForLocale(locale: Locale): Translation {
  return TRANSLATIONS[TRANSLATION_BY_LOCALE[locale]];
}

export function isTranslationId(value: string): value is TranslationId {
  return value in TRANSLATIONS;
}
