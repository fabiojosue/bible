import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInForm } from "@/features/auth/sign-in-form";
import { routing } from "@/i18n/routing";

type Props = PageProps<"/[locale]/sign-in">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("signIn"), robots: { index: false } };
}

export default async function SignInPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Account");

  return (
    <div className="mx-auto grid max-w-sm gap-8 px-5 py-10 sm:py-16">
      <header className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("signInTitle")}</h1>
        <p className="text-sm text-pretty text-muted-foreground">{t("signInIntro")}</p>
      </header>
      {/* The form reads the query string, which only exists at request time. */}
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
