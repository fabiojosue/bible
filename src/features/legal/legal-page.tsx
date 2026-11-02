import { getTranslations } from "next-intl/server";
import { PAGE_PATHS } from "@/features/bible/routes";
import { Link } from "@/i18n/navigation";

interface LegalSection {
  title: string;
  paragraphs: string[];
}

export async function LegalPage({ document }: { document: "Privacy" | "Terms" }) {
  const t = await getTranslations();
  const sections = t.raw(`${document}.sections`) as LegalSection[];
  const other = document === "Privacy" ? "Terms" : "Privacy";

  return (
    <article className="mx-auto grid max-w-2xl gap-8 px-5 py-10 sm:px-8 lg:py-16">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t(`${document}.title`)}</h1>
        <p className="text-sm text-muted-foreground">
          {t("Legal.updated", { date: "2026-11-02" })}
        </p>
        <p className="text-pretty text-muted-foreground">{t(`${document}.intro`)}</p>
      </header>
      {sections.map((section) => (
        <section key={section.title} className="grid gap-2">
          <h2 className="font-semibold tracking-tight">{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed text-pretty text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      <footer className="border-t pt-6 text-sm">
        <Link
          href={other === "Privacy" ? PAGE_PATHS.privacy : PAGE_PATHS.terms}
          className="underline underline-offset-4 hover:text-foreground"
        >
          {t(`${other}.title`)}
        </Link>
      </footer>
    </article>
  );
}
