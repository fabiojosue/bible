"use client";

import { CloudIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { PAGE_PATHS } from "@/features/bible/routes";
import { Link } from "@/i18n/navigation";
import { useSession } from "./auth-client";

/** One line under the progress summary: who it syncs with, or an invitation to sign in. */
export function SyncPrompt() {
  const t = useTranslations("Account");
  const { data: session, isPending } = useSession();

  return (
    // Reserves its line while the session loads so the page doesn't shift.
    <p className="flex min-h-5 items-center gap-2 text-sm text-muted-foreground">
      {!isPending && (
        <>
          <CloudIcon aria-hidden className="size-4 shrink-0" />
          <span>
            {session
              ? t("promptSignedIn", { email: session.user.email })
              : t.rich("promptSignedOut", {
                  link: (chunks) => (
                    <Link
                      href={PAGE_PATHS.signIn}
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
          </span>
        </>
      )}
    </p>
  );
}
