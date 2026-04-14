# AGENTS.md

## Commands

```sh
npm run dev              # Next.js dev server (port 3000)
npm run build            # prisma generate && prisma migrate dev && next build
npm run lint             # eslint (flat config, ESLint 9)
npm run db:seed:dev      # tsx --env-file=.env.development prisma/seed.ts
npm run db:seed:prod     # tsx --env-file=.env.production prisma/seed.ts
npx prisma generate      # regenerate client to lib/generated/prisma/
npx prisma migrate dev   # create/apply migration (env selected by prisma.config.ts via NODE_ENV)
npx shadcn add <name>    # add shadcn/ui component (style: base-nova)
```

No test framework is configured. No formatter script — Prettier uses default config (`{}`).

## Architecture

**Next.js 16** App Router, **React 19**, **Prisma 7** (PostgreSQL via `@prisma/adapter-pg` + raw `pg` Pool), **Tailwind CSS 4**, **shadcn/ui** (base-nova style), **Zod 4**, **AWS S3** for media.

### Models vs Invitations (key pattern)

- **Models** = structural layout only. Each model maps to a React component in `components/models/<Name>/`. The `Model` DB table has only identity fields: `name`, `label`, `description`, `component`, `previewImage`. No styling in DB.
- **Invitations** own all visual styling in their `styles` JSON column (`InvitationStyles` type). When creating an invitation, styles are initialized from the model component's exported `DEFAULT_STYLES` constant (`components/models/<Name>/defaults.ts`), then the invitation owns them independently.
- `components/models/index.ts` exports `MODEL_COMPONENTS` (dynamic import registry), `MODEL_DEFAULT_STYLES` map, and `getDefaultStylesForComponent()` helper.
- 4 active models: `ClassicFloral`, `ModernMinimal`, `BohoNatural`, `MidnightLuxe`.

### Key paths

| Path                                               | What                                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `lib/types.ts`                                     | Canonical TypeScript interfaces (~540 lines). Source of truth for all JSON column shapes.      |
| `lib/db.ts`                                        | Prisma singleton with pg adapter. Import client from `@/lib/generated/prisma/client`.          |
| `lib/invitations.ts`, `lib/models.ts`              | Data access layer.                                                                             |
| `components/models/`                               | Active model components + `defaults.ts` + shared `types.ts` (`ModelComponentProps`).           |
| `components/admin/StyleCustomizationSection.tsx`   | Shared style editor used by both InvitationForm and ExternalInvitationForm.                    |
| `components/admin/ThemeForm.tsx`                   | Model identity editor (5 fields only, no styles).                                              |
| `app/admin/invitations/InvitationForm.tsx`         | ~2500 lines. Standard invitation CRUD form.                                                    |
| `app/admin/invitations/ExternalInvitationForm.tsx` | ~650 lines. External (video/link) invitation form.                                             |
| `app/api/admin/models/`                            | Models CRUD API.                                                                               |
| `data/invitations/*.json`                          | Seed fixture data (4 invitations).                                                             |
| `prisma.config.ts`                                 | Selects `.env.development` or `.env.production` based on `NODE_ENV` (defaults to development). |

### Routes

- `/[slug]` — public invitation page (`force-dynamic`, every request hits DB)
- `/admin/*` — admin panel (no auth — unprotected)
- `/confirmacoes/[token]` — owner RSVP confirmations via `ownerToken` in URL
- `/api/admin/*` — admin APIs
- `/api/events` — client-side analytics tracking
- `/api/rsvp` — public RSVP submission
- `/api/upload/presign` — S3 presigned upload URLs

## Gotchas

1. **Prisma client output is `lib/generated/prisma/`** (gitignored). Import from `@/lib/generated/prisma/client`, never `@prisma/client`. Run `npx prisma generate` after schema changes before building.

2. **Prisma uses pg driver adapter**, not the default engine. `PrismaClient` requires `{ adapter }` — see `lib/db.ts`.

3. **Tailwind v4 has no config file.** Theme is defined via `@theme inline` in `globals.css`. Do not create `tailwind.config.js`.

4. **Next.js 16 async params.** Page `params` are `Promise<{ slug: string }>` and must be awaited.

5. **Zod 4**, not Zod 3. API and import patterns differ from most online examples.

6. **shadcn/ui uses `@base-ui/react` primitives.** Accordion uses `multiple` prop (not `type="multiple"`). Check `components/ui/` for the actual wrapper API before using.

7. **`components/templates/`** is legacy (old names: PinkFloral, BohoChic, MidnightElegance). Active model components are in `components/models/`. Deprecated type aliases `TemplateName` and `TemplateTheme` exist in `lib/types.ts`.

8. **Most invitation fields are `Json` in Prisma** with no DB-level validation. The TypeScript interfaces in `lib/types.ts` are the only structural contract.

9. **Seed script uses `tsx` with `@/` path aliases.** Do not switch to plain `node`.

10. **`npm run build` runs `prisma migrate dev`** as part of the build — this is a destructive dev command. Be aware in CI/production contexts.

11. **All user-facing text is Portuguese.** Code and comments are English. Overridable text uses the `t()` helper from `lib/custom-texts.ts`.

12. **10 Google Fonts** are loaded in root layout as CSS variables and also available via dynamic loading (`DynamicFontLoader` + `FontPicker`).

13. **`pg` must stay in `serverExternalPackages`** in `next.config.ts` for the native driver to work.

14. **No `.env` files are committed.** Both `.env.development` and `.env.production` are gitignored. Required vars: `DATABASE_URL`, `AWS_REGION`, `S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
