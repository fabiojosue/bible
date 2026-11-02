# Bible

A calm, accessible place to read the Bible in English and Spanish. It remembers where you left off, tracks the chapters you've read, and gets out of the way while you read.

- **Texts:** [World English Bible](https://ebible.org/engwebp/) (English) and [Reina-Valera 1909](https://ebible.org/spaRV1909/) (Spanish), both public domain.
- **Stack:** Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, next-intl, zustand.

## Features

- **Resume reading:** the verse you're on is saved as you scroll and offered on the home page.
- **Progress:** chapters are marked read once you reach their end; per-book and overall progress.
- **Quick jump:** <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>K</kbd> or <kbd>/</kbd> opens search; type `John 3:16`, `jn 3 16`, `1 cor 13` or `Salmos 23` in either language.
- **Reading settings:** text size, line spacing, width, serif or sans, verse numbers, dark/light/system theme. Applied before first paint, so there is no flash.
- **Keyboard:** <kbd>←</kbd> / <kbd>→</kbd> move between chapters.
- **Side by side:** English and Spanish verse by verse (two columns on desktop, alternating on phones).
- **Adaptive layout:** sidebar, popovers and shortcuts on desktop; a thumb-reachable bottom bar, drawers and a header that tucks away while reading on phones.
- **First-visit tour:** a short, skippable walkthrough, replayable from settings.

- **Optional accounts:** sign in with Google or email and password to sync reading progress across devices. Reading never requires an account.

Progress and settings live in `localStorage`. When someone is signed in, progress also syncs to Postgres: every chapter mark and the reading position carry the time they changed, and the newest change wins, so devices can sync in any order, offline edits included (`src/features/sync/`). Accounts are keyed by user, not by domain, so changing the site's domain keeps everyone's progress.

## Getting started

Requires Node 24 and pnpm 11.

```bash
pnpm install
vercel env pull .env.local   # or create it by hand, see below
pnpm db:migrate
pnpm dev
```

Open http://localhost:3000.

### Environment variables

| Variable                                    | Purpose                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`                              | Postgres connection string (Neon in production)                         |
| `DATABASE_URL_UNPOOLED`                     | Optional direct connection, used for migrations                         |
| `BETTER_AUTH_SECRET`                        | Random secret for signing sessions (`openssl rand -base64 32`)          |
| `BETTER_AUTH_URL`                           | Fallback site URL for hosts not in `allowedHosts` (`src/features/auth`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional; enables "Continue with Google"                                |

Google sign-in needs `https://<host>/api/auth/callback/google` registered as a redirect URI for every host that offers it.

## Scripts

| Script             | What it does                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`         | Development server                                                                                                     |
| `pnpm build`       | Production build (prerenders every chapter in both languages)                                                          |
| `pnpm lint`        | ESLint                                                                                                                 |
| `pnpm typecheck`   | TypeScript                                                                                                             |
| `pnpm format`      | Prettier                                                                                                               |
| `pnpm test`        | Unit tests (Vitest)                                                                                                    |
| `pnpm test:e2e`    | End-to-end and accessibility tests (Playwright + axe) on desktop Chrome, Pixel 7 and iPhone 14; run `pnpm build` first |
| `pnpm bible:build` | Re-downloads the source texts and regenerates `data/bible/`                                                            |
| `pnpm db:generate` | Creates a migration in `drizzle/` from changes to `src/db/schema.ts`                                                   |
| `pnpm db:migrate`  | Applies pending migrations                                                                                             |
| `pnpm db:studio`   | Browses the database                                                                                                   |

## Project structure

```
data/bible/{web,rv1909}/   One JSON file per book, generated by scripts/build-bible.mts
messages/                  UI strings (en, es)
src/app/[locale]/          Home, book and chapter routes
src/app/api/chapters/      Static per-chapter JSON for the side-by-side view
src/app/api/auth/          Better Auth endpoints
src/app/api/sync/          Progress sync endpoint
src/proxy.ts               Locale routing and 404s for unknown passages
src/db/                    Drizzle schema and client; migrations in drizzle/
src/features/
  auth/                    Better Auth setup, sign-in page, account menu
  sync/                    Sync protocol, validation, server and browser engine
  bible/                   Canon, references, routes, data access
  reader/                  Chapter text, reading tracker, side by side, hotkeys
  progress/                Reading progress store and widgets
  search/                  Command palette
  settings/                Reader settings store and panel
  navigation/              Book and chapter navigator
  onboarding/              First-visit tour
  shell/                   Header, sidebar, mobile bar
src/components/ui/         shadcn/ui components, adapted for this app
e2e/                       Playwright tests
```

URLs are localized: `/en/john/3#v16` and `/es/juan/3#v16`.

## Deploying

Import the repository in Vercel, add a Neon Postgres database from the Vercel Marketplace (it sets the `DATABASE_*` variables), set the auth variables above, and run `pnpm db:migrate` against it before the first deploy that needs a new migration.
