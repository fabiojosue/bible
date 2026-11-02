"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { type PathLocation, parsePath } from "./routes";

/** The book/chapter the user is currently viewing, if any. */
export function useCurrentLocation(): PathLocation | undefined {
  const pathname = usePathname();
  const locale = useLocale();
  return parsePath(pathname, locale);
}
