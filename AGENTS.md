# AGENTS.md

Next.js 16 (App Router, React 19) wedding invitation system. Postgres via Prisma 7, S3 for media, JWT cookie auth for `/admin`.

## Commands

- `npm run dev` — dev server (uses `.env.development`, loaded by Next automatically)
- `npm run dev:prod` — dev server against production env (`env-cmd -f .env.production`)
- `npm run build` — runs `prisma generate && prisma migrate deploy && next build`. **Never `next build` directly** or the Prisma client at `lib/generated/prisma/` will be stale/missing.
- `npm run lint` — flat-config ESLint (`eslint.config.mjs`, extends `eslint-config-next`)
- `npm test` — Vitest, node env, only files matching `tests/**/*.test.ts`. No DOM, no globals. Run a single test with `npx vitest run tests/<name>.test.ts`.
- `npm run db:migrate:dev` / `db:migrate:prod` — `prisma migrate dev` with `NODE_ENV` set so `prisma.config.ts` loads the right `.env.<env>` file.
- `npm run db:seed:dev` / `db:seed:prod` — `tsx --env-file=.env.<env> prisma/seed.ts`. Idempotent theme + sample data seed.
- `npm run db:generate` — regenerate Prisma client into `lib/generated/prisma/` (gitignored).
- `scripts/hash-password.ts` — `npx tsx scripts/hash-password.ts <pw>` produces a bcrypt hash already escaped for `.env` files (`$` → `\$`). The escaped form is required because Next.js env loading interpolates `$`.

There is no typecheck script; rely on `next build` or `tsc --noEmit` if you need one.

## Environment

- Env files live at the repo root: `.env.development` and `.env.production`. Both are gitignored but tracked locally and contain real secrets (DB, AWS, JWT). Do not commit them.
- `prisma.config.ts` selects the env file by `NODE_ENV` (defaults to `development`). The npm scripts above already set this; if you invoke Prisma manually, set `NODE_ENV` yourself.
- Required vars: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `AWS_*`, `S3_BUCKET_NAME`. `GOOGLE_FONTS_API_KEY` and `NEXT_PUBLIC_SITE_URL` are optional.

## Architecture

App Router routes (`app/`):
- `app/[slug]/` — public invitation page (force-dynamic, generates OG metadata per invitation)
- `app/s/[slug]/` — public save-the-date page (force-dynamic)
- `app/confirmar/[slug]/`, `app/confirmacoes/[token]/` — RSVP flows
- `app/admin/` + `app/api/admin/` — protected by `middleware.ts` (JWT cookie `auth-token`). API routes return 401 JSON; pages redirect to `/login?from=…`.
- `app/api/upload/presign` — also gated by middleware; issues S3 presigned PUT URLs
- `app/canva-proxy/[...path]/route.ts` — reverse proxies Canva-published sites and strips `frame-ancestors`/`X-Frame-Options` so they can be iframed. Used by invitation views that embed Canva content.

Domain library (`lib/`):
- `lib/db.ts` — singleton Prisma client using `@prisma/adapter-pg` over `pg.Pool`. Always import `prisma` from here, never instantiate `PrismaClient` directly.
- `lib/generated/prisma/` — generated client, gitignored. If imports from `@/lib/generated/prisma/client` fail, run `npm run db:generate`.
- `lib/auth.ts` — `jose`-based JWT helpers and `AUTH_COOKIE_NAME`.
- `lib/s3.ts` — presigned upload helpers.
- Most other files in `lib/` are pure data/format utilities and are the units covered by `tests/`.

Other:
- `prisma/schema.prisma` declares `generator client { provider = "prisma-client"; output = "../lib/generated/prisma" }`. Schema is migration-driven; edit schema then `npm run db:migrate:dev -- --name <desc>`.
- `next.config.ts` marks `pg`, `bcrypt`, `ffmpeg-static` as `serverExternalPackages` — they ship native binaries or use `__dirname` and break when bundled. Don't remove them from this list.
- `middleware.ts` `matcher` only covers `/admin/*`, `/api/admin/*`, and `/api/upload/presign`. Adding new protected routes requires editing the matcher.
- `data/invitations/*.json` is reference content, not imported by the app.

## Conventions

- TypeScript path alias: `@/*` → repo root (mirrored in `vitest.config.ts`).
- shadcn/ui (`components.json`, style `base-nova`, base color `neutral`, Lucide icons). Tailwind v4 via `@tailwindcss/postcss`; global CSS at `app/globals.css`.
- Prettier defaults (`.prettierrc` is `{}`); ESLint flat config; no commit hooks configured.
- Server components are the default; public pages use `export const dynamic = "force-dynamic"` because data is per-request from the DB.

## Testing notes

- Vitest runs in node, not jsdom. Tests in `tests/` import from `@/lib/*` and exercise pure functions (text styles, social preview metadata, JSON sanitization, canva proxy HTML rewrite, etc.). Don't add DOM-dependent tests without first switching the environment in `vitest.config.ts`.
- No DB integration tests; Prisma is not initialized in the test process.
