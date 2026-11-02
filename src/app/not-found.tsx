import Link from "next/link";
import "./globals.css";

/** Rendered for paths outside any locale, which have no localized layout. */
export default function GlobalNotFound() {
  return (
    <html lang="en" className="dark">
      <body className="grid min-h-dvh place-items-center bg-background p-6 font-sans text-foreground">
        <main className="text-center">
          <h1 className="text-2xl font-semibold">Page not found</h1>
          <p className="mt-2 text-muted-foreground">
            <Link className="underline underline-offset-4" href="/">
              Go to the Bible / Ir a la Biblia
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
