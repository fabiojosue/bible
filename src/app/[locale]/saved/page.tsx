import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SavedVerses } from "@/features/progress/saved-verses";
import { routing } from "@/i18n/routing";

type Props = PageProps<"/[locale]/saved">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Saved" });
  return { title: t("title"), robots: { index: false } };
}

export default async function SavedPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Saved");

  return (
    <div className="mx-auto grid max-w-2xl gap-8 px-5 py-10 sm:px-8 lg:py-16">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-pretty text-muted-foreground">{t("intro")}</p>
      </header>
      <SavedVerses />
    </div>
  );
}
