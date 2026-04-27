# Guest Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-invitation guest pre-registration, personalized invite links, table assignments, WhatsApp/SMS share helpers, and a host-facing guest list editor — all admin-gated and off by default.

**Architecture:** New relational `Guest` model with a unique public token, plus `guestManagementEnabled` + `guestMessageTemplate` columns on `Invitation` and a nullable `guestId` FK on `RsvpResponse`. Owner-token-scoped APIs at `/api/owner/[token]/guests` mirror admin endpoints under `/api/admin/invitations/[id]/guests`. Public invite reads `?g=<token>` to render a personalized card and prefill the RSVP. The host page `/confirmacoes/[token]` becomes tabbed (Confirmações + Convidados).

**Tech Stack:** Next.js 16 (App Router), Prisma 7 + PostgreSQL, React 19, TypeScript, react-hook-form + zod, shadcn/ui (Sheet, Dialog, Tabs, Accordion, Switch, Select), framer-motion, sonner (toasts), Vitest for unit tests.

**Spec:** `docs/superpowers/specs/2026-04-27-guest-management-design.md`

---

## File Structure

| File | Responsibility |
|------|----------------|
| `prisma/schema.prisma` | Add `Guest` model; add `guestManagementEnabled`/`guestMessageTemplate` to `Invitation`; add `guestId` to `RsvpResponse` |
| `prisma/migrations/<ts>_add_guest_management/migration.sql` | DDL (Prisma-generated) |
| `lib/guest-links.ts` | Pure utilities: `buildPersonalInviteUrl`, `buildWhatsAppUrl`, `buildSmsUrl`, `renderMessageTemplate`, `COUNTRY_CODES`, `slugifyName` |
| `lib/guests.ts` | Server-side data access: `getGuestByToken`, `getGuestsForInvitation`, `createGuest`, `updateGuest`, `deleteGuest`, `selfRegisterGuest`, types |
| `lib/types.ts` | Add `Guest`/`GuestData` types; extend `InvitationData` with `guestManagementEnabled`, `guestMessageTemplate`, optional current `guest` |
| `lib/invitations.ts` | Include new fields in `toInvitationData` |
| `app/api/owner/[token]/guests/route.ts` | GET (list), POST (create) — owner-token-scoped |
| `app/api/owner/[token]/guests/[guestId]/route.ts` | PATCH, DELETE — owner-token-scoped |
| `app/api/admin/invitations/[id]/guests/route.ts` | GET, POST — JWT-auth admin |
| `app/api/admin/invitations/[id]/guests/[guestId]/route.ts` | PATCH, DELETE — JWT-auth admin |
| `app/api/guests/by-token/[token]/route.ts` | GET — public guest lookup, minimal fields |
| `app/api/guests/self-register/route.ts` | POST — secondary guest self-registration |
| `app/api/rsvp/route.ts` | Modified: accept optional `guestToken`, link RSVP |
| `app/api/admin/invitations/route.ts` | Modified: persist `guestManagementEnabled`/`guestMessageTemplate` on create |
| `app/api/admin/invitations/[id]/route.ts` | Modified: persist same fields on update |
| `components/admin/GuestListEditor.tsx` | Reusable list editor (host page + admin form) |
| `components/admin/GuestForm.tsx` | Add/Edit form rendered inside a `Sheet` |
| `components/admin/GuestRowActions.tsx` | Per-row icons (copy / WhatsApp / SMS / edit / delete) |
| `components/shared/PersonalGuestCard.tsx` | Personal guest section on the public invite |
| `components/shared/InviteOthersModal.tsx` | "Convidar mais pessoas" modal |
| `components/shared/RSVPModal.tsx` | Modified: accept `guest` prop, prefill, send `guestToken` |
| `components/shared/InvitationPage.tsx` | Modified: accept `guest` prop, mount `<PersonalGuestCard>`, forward to RSVP |
| `app/[slug]/page.tsx` | Modified: read `?g=<token>` server-side, fetch guest, pass to view |
| `app/[slug]/InvitationView.tsx` | Modified: forward `guest` prop to `InvitationPage` |
| `app/confirmacoes/[token]/page.tsx` | Modified: tabbed layout (Confirmações + Convidados) |
| `app/confirmacoes/[token]/GuestsTabClient.tsx` | New client wrapper that mounts `<GuestListEditor>` for owner-token API |
| `app/admin/invitations/InvitationForm.tsx` | Modified: add "Gestão de Convidados" accordion section |
| `vitest.config.ts` | Vitest config (Node environment, `tests/**/*.test.ts` glob) |
| `tests/guest-links.test.ts` | Vitest unit tests for `lib/guest-links.ts` |
| `tests/guests-slug.test.ts` | Vitest unit tests for the slugifier |
| `tests/envelope-cover-background.test.ts` | Modified: ported to Vitest |
| `tests/save-the-date-envelope.test.ts` | Modified: ported to Vitest |
| `tests/save-the-date-rsvp-button.test.ts` | Modified: ported to Vitest |
| `package.json` | Modified: add Vitest dev dependency, `test` and `test:watch` scripts |

---

## Task 1: Install Vitest, configure it, and migrate existing tests

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Modify: `tests/envelope-cover-background.test.ts`
- Modify: `tests/save-the-date-envelope.test.ts`
- Modify: `tests/save-the-date-rsvp-button.test.ts`

- [ ] **Step 1: Install Vitest**

Run: `npm install --save-dev vitest@^2`

Expected: installs `vitest` and its peers. Verify with:

Run: `npx vitest --version`

Expected: prints something like `vitest/2.x.x`.

- [ ] **Step 2: Create `vitest.config.ts` at the repo root**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Tests are pure-utility unit tests; no globals or DOM needed.
    globals: false,
  },
});
```

- [ ] **Step 3: Add `test` and `test:watch` scripts to `package.json`**

In the `scripts` object, add two entries below `db:studio` (or anywhere in the block):

```json
"test": "vitest run",
"test:watch": "vitest",
```

The final `scripts` block should look like (excerpt):

```json
"scripts": {
  "dev": "next dev",
  "dev:prod": "env-cmd -f .env.production next dev",
  "build": "prisma generate && prisma migrate deploy && next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "db:seed:dev": "tsx --env-file=.env.development prisma/seed.ts",
  ...
}
```

- [ ] **Step 4: Migrate `tests/envelope-cover-background.test.ts`**

Replace the file contents with:

```typescript
import { describe, expect, it } from "vitest";
import { getCoverBackgroundStyle } from "../lib/envelope-cover-background";

describe("getCoverBackgroundStyle", () => {
  it("returns backgroundColor for a hex color", () => {
    expect(getCoverBackgroundStyle("#111827", "#ffffff")).toEqual({
      backgroundColor: "#111827",
    });
  });

  it("falls back to the second arg when value is empty", () => {
    expect(getCoverBackgroundStyle("", "#f7f0e8")).toEqual({
      backgroundColor: "#f7f0e8",
    });
  });

  it("returns a backgroundImage for an absolute URL", () => {
    expect(
      getCoverBackgroundStyle("https://cdn.example.com/envelope.jpg", "#ffffff"),
    ).toEqual({
      backgroundImage: 'url("https://cdn.example.com/envelope.jpg")',
      backgroundPosition: "center",
      backgroundSize: "cover",
    });
  });

  it("returns a backgroundImage for a local path", () => {
    expect(getCoverBackgroundStyle("/images/envelope.png", "#ffffff")).toEqual({
      backgroundImage: 'url("/images/envelope.png")',
      backgroundPosition: "center",
      backgroundSize: "cover",
    });
  });
});
```

- [ ] **Step 5: Migrate `tests/save-the-date-envelope.test.ts`**

Replace the file contents with:

```typescript
import { describe, expect, it } from "vitest";
import { getSaveTheDateEnvelopeCoverBackground } from "../lib/save-the-date-envelope";

const themeEnvelope = {
  base: "#f7f0e8",
  topFlap: "/top.png",
  bottomFlap: "/bottom.png",
};

describe("getSaveTheDateEnvelopeCoverBackground", () => {
  it("returns the override coverBackground when provided", () => {
    const result = getSaveTheDateEnvelopeCoverBackground(themeEnvelope, {
      coverBackground: "https://cdn.example.com/std-cover.jpg",
    });
    expect(result).toBe("https://cdn.example.com/std-cover.jpg");
  });

  it("falls back to override.base when coverBackground is missing", () => {
    const result = getSaveTheDateEnvelopeCoverBackground(themeEnvelope, {
      base: "#111827",
    });
    expect(result).toBe("#111827");
  });

  it("falls back to the theme envelope.base when no override is provided", () => {
    const result = getSaveTheDateEnvelopeCoverBackground(themeEnvelope, null);
    expect(result).toBe("#f7f0e8");
  });
});
```

- [ ] **Step 6: Migrate `tests/save-the-date-rsvp-button.test.ts`**

Replace the file contents with:

```typescript
import { describe, expect, it } from "vitest";
import { getSaveTheDateRsvpButtonBackground } from "../lib/save-the-date-rsvp-button";

describe("getSaveTheDateRsvpButtonBackground", () => {
  it("returns the explicit rsvpButtonBgColor", () => {
    const background = getSaveTheDateRsvpButtonBackground({
      heartColor: "#D4AF37",
      heartGlitterColors: ["#F5E6A3"],
      rsvpButtonBgColor: "#8B5CF6",
    });
    expect(background).toBe("#8B5CF6");
  });
});
```

- [ ] **Step 7: Run the tests**

Run: `npm test`

Expected: Vitest reports 3 test files, several passing tests (4 + 3 + 1 = 8), and exits 0. Output looks like:

```
 ✓ tests/envelope-cover-background.test.ts (4)
 ✓ tests/save-the-date-envelope.test.ts (3)
 ✓ tests/save-the-date-rsvp-button.test.ts (1)

 Test Files  3 passed (3)
      Tests  8 passed (8)
```

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/
git commit -m "chore(test): adopt Vitest and migrate existing unit tests"
```

---

## Task 2: Implement and unit-test `lib/guest-links.ts` (pure module)

**Files:**
- Create: `lib/guest-links.ts`
- Create: `tests/guest-links.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/guest-links.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  buildPersonalInviteUrl,
  buildWhatsAppUrl,
  buildSmsUrl,
  renderMessageTemplate,
  COUNTRY_CODES,
  slugifyName,
} from "../lib/guest-links";

describe("slugifyName", () => {
  it("strips accents and lowercases", () => {
    expect(slugifyName("José")).toBe("jose");
  });

  it("slugifies multi-word accented names", () => {
    expect(slugifyName("Conceição da Silva")).toBe("conceicao-da-silva");
  });

  it("collapses repeated whitespace and trims", () => {
    expect(slugifyName("  Maria   Silva  ")).toBe("maria-silva");
  });

  it("collapses repeated separators", () => {
    expect(slugifyName("Ana--Beatriz")).toBe("ana-beatriz");
  });

  it("returns empty string for empty input", () => {
    expect(slugifyName("")).toBe("");
  });

  it("strips non-alphanumeric symbols like &", () => {
    expect(slugifyName("João & Maria")).toBe("joao-maria");
  });
});

describe("buildPersonalInviteUrl", () => {
  it("builds the canonical URL with g and n params", () => {
    expect(
      buildPersonalInviteUrl({
        origin: "https://example.com",
        slug: "ana-pedro",
        token: "tok123",
        name: "Maria Silva",
      }),
    ).toBe("https://example.com/ana-pedro?g=tok123&n=maria-silva");
  });

  it("normalizes a trailing slash on the origin", () => {
    expect(
      buildPersonalInviteUrl({
        origin: "https://example.com/",
        slug: "ana-pedro",
        token: "tok123",
        name: "Maria Silva",
      }),
    ).toBe("https://example.com/ana-pedro?g=tok123&n=maria-silva");
  });

  it("slugifies accented names for the n param", () => {
    expect(
      buildPersonalInviteUrl({
        origin: "https://example.com",
        slug: "ana-pedro",
        token: "tok",
        name: "José",
      }),
    ).toBe("https://example.com/ana-pedro?g=tok&n=jose");
  });

  it("omits the n param when the name is empty", () => {
    expect(
      buildPersonalInviteUrl({
        origin: "https://example.com",
        slug: "ana-pedro",
        token: "tok",
        name: "",
      }),
    ).toBe("https://example.com/ana-pedro?g=tok");
  });
});

describe("buildWhatsAppUrl", () => {
  it("strips the leading + and percent-encodes spaces in the message", () => {
    expect(
      buildWhatsAppUrl({
        countryCode: "+258",
        phoneNumber: "841234567",
        message: "Olá Maria",
      }),
    ).toBe("https://wa.me/258841234567?text=Ol%C3%A1%20Maria");
  });

  it("strips spaces from phone digits", () => {
    expect(
      buildWhatsAppUrl({
        countryCode: "+351",
        phoneNumber: "912 345 678",
        message: "Test",
      }),
    ).toBe("https://wa.me/351912345678?text=Test");
  });

  it("omits ?text= when the message is empty", () => {
    expect(
      buildWhatsAppUrl({
        countryCode: "+258",
        phoneNumber: "841234567",
        message: "",
      }),
    ).toBe("https://wa.me/258841234567");
  });
});

describe("buildSmsUrl", () => {
  it("keeps the leading + and url-encodes the body", () => {
    expect(
      buildSmsUrl({
        countryCode: "+258",
        phoneNumber: "841234567",
        message: "Olá Maria",
      }),
    ).toBe("sms:+258841234567?body=Ol%C3%A1%20Maria");
  });

  it("returns a bare sms: URI when the message is empty", () => {
    expect(
      buildSmsUrl({
        countryCode: "+1",
        phoneNumber: "5551234",
        message: "",
      }),
    ).toBe("sms:+15551234");
  });
});

describe("renderMessageTemplate", () => {
  it("substitutes {name} and {link}", () => {
    expect(
      renderMessageTemplate("Olá {name}, link: {link}", {
        name: "Maria",
        link: "https://x.com/y",
      }),
    ).toBe("Olá Maria, link: https://x.com/y");
  });

  it("substitutes multiple occurrences of the same placeholder", () => {
    expect(
      renderMessageTemplate("{name} {name}", { name: "A", link: "" }),
    ).toBe("A A");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(
      renderMessageTemplate("hi {name} {unknown}", { name: "A", link: "" }),
    ).toBe("hi A {unknown}");
  });

  it("returns empty string for an empty template", () => {
    expect(renderMessageTemplate("", { name: "A", link: "B" })).toBe("");
  });
});

describe("COUNTRY_CODES", () => {
  it("starts with Mozambique as the default", () => {
    expect(COUNTRY_CODES[0].code).toBe("+258");
    expect(COUNTRY_CODES[0].label).toBe("Moçambique");
  });

  it("includes the documented set of country codes", () => {
    const codes = COUNTRY_CODES.map((c) => c.code);
    expect(codes).toEqual(
      expect.arrayContaining(["+258", "+351", "+55", "+1", "+44", "+34", "+27"]),
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/guest-links.test.ts`

Expected: FAIL with `Error: Failed to resolve import "../lib/guest-links"` or similar (the implementation does not yet exist).

- [ ] **Step 3: Implement `lib/guest-links.ts`**

Create `lib/guest-links.ts`:

```typescript
/**
 * Pure utilities for guest links and message rendering.
 *
 * No React, no Next.js, no Prisma — fully unit-testable. All inputs/outputs
 * are plain strings/objects.
 */

// ---------------------------------------------------------------------------
// Country codes (ordered: default first, then PT, BR, US, UK, ES, ZA)
// ---------------------------------------------------------------------------

export interface CountryCodeOption {
  code: string;   // dialing prefix with leading "+", e.g. "+258"
  label: string;  // human label (PT)
  flag: string;   // emoji flag for UI affordance
}

export const COUNTRY_CODES: ReadonlyArray<CountryCodeOption> = [
  { code: "+258", label: "Moçambique", flag: "🇲🇿" },
  { code: "+351", label: "Portugal", flag: "🇵🇹" },
  { code: "+55", label: "Brasil", flag: "🇧🇷" },
  { code: "+1", label: "EUA / Canadá", flag: "🇺🇸" },
  { code: "+44", label: "Reino Unido", flag: "🇬🇧" },
  { code: "+34", label: "Espanha", flag: "🇪🇸" },
  { code: "+27", label: "África do Sul", flag: "🇿🇦" },
];

export const DEFAULT_COUNTRY_CODE = "+258";

// ---------------------------------------------------------------------------
// Slugifier (URL-safe ASCII slug, matches the project's existing pattern)
// ---------------------------------------------------------------------------

export function slugifyName(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Personal invite URL
// ---------------------------------------------------------------------------

export interface BuildPersonalInviteUrlInput {
  origin: string;   // e.g. "https://example.com" (trailing slash tolerated)
  slug: string;     // invitation slug
  token: string;    // guest token
  name: string;     // human name; will be slugified for the `n` query param
}

export function buildPersonalInviteUrl(
  input: BuildPersonalInviteUrlInput,
): string {
  const origin = input.origin.replace(/\/+$/, "");
  const params = new URLSearchParams();
  params.set("g", input.token);
  const nameSlug = slugifyName(input.name);
  if (nameSlug) params.set("n", nameSlug);
  // Decode '%20' back to '+' nope — keep `+` as `%2B`. URLSearchParams already
  // encodes spaces as '+'. We want literal `g=tok&n=maria-silva`, which is
  // what we get because the inputs contain no special chars after slugifying.
  return `${origin}/${input.slug}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Phone helpers
// ---------------------------------------------------------------------------

function stripPhoneDigits(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

function stripCountryCodePlus(code: string): string {
  return code.replace(/^\+/, "");
}

// ---------------------------------------------------------------------------
// WhatsApp URL — wa.me requires no '+', E.164 digits only
// ---------------------------------------------------------------------------

export interface BuildPhoneLinkInput {
  countryCode: string;  // includes leading "+"
  phoneNumber: string;  // local number, may include spaces
  message: string;      // pre-rendered message
}

export function buildWhatsAppUrl(input: BuildPhoneLinkInput): string {
  const digits = stripCountryCodePlus(input.countryCode) + stripPhoneDigits(input.phoneNumber);
  const base = `https://wa.me/${digits}`;
  if (!input.message) return base;
  // encodeURIComponent over manual ?text= so we encode spaces as %20 (not '+')
  return `${base}?text=${encodeURIComponent(input.message)}`;
}

// ---------------------------------------------------------------------------
// SMS URL — `sms:` URI keeps the '+', body is URL-encoded
// ---------------------------------------------------------------------------

export function buildSmsUrl(input: BuildPhoneLinkInput): string {
  const fullPhone = `${input.countryCode}${stripPhoneDigits(input.phoneNumber)}`;
  const base = `sms:${fullPhone}`;
  if (!input.message) return base;
  return `${base}?body=${encodeURIComponent(input.message)}`;
}

// ---------------------------------------------------------------------------
// Message template rendering
// ---------------------------------------------------------------------------

export interface MessageTemplateVars {
  name: string;
  link: string;
}

/** Replace `{name}` and `{link}` placeholders. Unknown placeholders untouched. */
export function renderMessageTemplate(
  template: string,
  vars: MessageTemplateVars,
): string {
  return template
    .split("{name}").join(vars.name)
    .split("{link}").join(vars.link);
}

// ---------------------------------------------------------------------------
// Default message template used when an invitation has no custom template
// ---------------------------------------------------------------------------

export const DEFAULT_GUEST_MESSAGE_TEMPLATE =
  "Olá {name}, estás convidado(a) para o nosso casamento. Confirma a tua presença e vê todos os detalhes aqui: {link}";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/guest-links.test.ts`

Expected: Vitest reports `tests/guest-links.test.ts (N passed)` for all describe blocks (`slugifyName`, `buildPersonalInviteUrl`, `buildWhatsAppUrl`, `buildSmsUrl`, `renderMessageTemplate`, `COUNTRY_CODES`) and exits 0.

- [ ] **Step 5: Run full test suite**

Run: `npm test`

Expected: 4 test files (`envelope-cover-background`, `save-the-date-envelope`, `save-the-date-rsvp-button`, `guest-links`) all pass.

- [ ] **Step 6: Commit**

```bash
git add lib/guest-links.ts tests/guest-links.test.ts
git commit -m "feat(guests): add pure guest-links utilities with unit tests"
```

---

## Task 3: Add `Guest` model and update Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the `Guest` model and update related models**

Open `prisma/schema.prisma`. Edit the `Invitation` model — add two fields just before `ownerToken`:

```prisma
  invitationType String  @default("standard")
  externalLink   String?
  guestManagementEnabled Boolean @default(false)
  guestMessageTemplate   String?
  ownerToken   String   @unique @default(cuid())
```

Add a `guests` relation at the bottom of `Invitation` (alongside `rsvpResponses` and `events`):

```prisma
  rsvpResponses RsvpResponse[]
  events        InvitationEvent[]
  guests        Guest[]
}
```

Update the `RsvpResponse` model — add `guestId` and the relation:

```prisma
model RsvpResponse {
  id                  String   @id @default(cuid())
  invitationSlug      String
  guestName           String
  email               String?
  attending           Boolean
  dietaryRestrictions String?
  message             String?
  submittedAt         DateTime @default(now())

  invitation Invitation @relation(fields: [invitationSlug], references: [slug], onDelete: Cascade)

  guestId String?
  guest   Guest?  @relation(fields: [guestId], references: [id], onDelete: SetNull)

  @@index([invitationSlug])
  @@index([guestId])
}
```

Append the new `Guest` model just before the `SaveTheDateRsvpResponse` model (i.e. after `RsvpResponse`):

```prisma
// ---------------------------------------------------------------------------
// Guest management — per-invitation pre-registered guests
// ---------------------------------------------------------------------------

model Guest {
  id              String   @id @default(cuid())
  invitationSlug  String
  invitation      Invitation @relation(fields: [invitationSlug], references: [slug], onDelete: Cascade)

  token           String   @unique @default(cuid())

  name            String
  slugifiedName   String
  companion       String?

  phoneCountryCode String
  phoneNumber      String

  tableLabel      String
  canInviteOthers Boolean  @default(false)
  note            String?

  invitedById   String?
  invitedBy     Guest?  @relation("GuestInvitations", fields: [invitedById], references: [id], onDelete: SetNull)
  invitedGuests Guest[] @relation("GuestInvitations")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  rsvpResponses RsvpResponse[]

  @@index([invitationSlug])
  @@index([token])
}
```

- [ ] **Step 2: Generate the migration**

Run: `npm run db:migrate:dev -- --name add_guest_management`

Expected: Prisma creates `prisma/migrations/<timestamp>_add_guest_management/migration.sql`, applies it, and regenerates the client. Output ends with something like `Your database is now in sync with your schema.`

If it asks you to confirm a destructive change, abort and re-check — this should be purely additive.

- [ ] **Step 3: Verify the schema parses and the client regenerated**

Run: `npx prisma generate`

Expected: `✔ Generated Prisma Client`. No errors.

- [ ] **Step 4: Sanity-check the migration SQL**

Run: `ls prisma/migrations/*_add_guest_management/`

Expected: lists `migration.sql`.

Inspect the file:

Run: `cat prisma/migrations/*_add_guest_management/migration.sql`

Expected: contains `CREATE TABLE "Guest"`, `ALTER TABLE "Invitation" ADD COLUMN "guestManagementEnabled"`, `ALTER TABLE "Invitation" ADD COLUMN "guestMessageTemplate"`, `ALTER TABLE "RsvpResponse" ADD COLUMN "guestId"`.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/*_add_guest_management/
git commit -m "feat(db): add Guest model and guest-management invitation flags"
```

---

## Task 4: Add types in `lib/types.ts`

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Append guest types to `lib/types.ts`**

Append the following block to the very end of `lib/types.ts` (after the `TemplateTheme` interface):

```typescript
// ---------------------------------------------------------------------------
// Guest management
// ---------------------------------------------------------------------------

/** Public-safe guest data exposed to the invitation page (no phone). */
export interface PublicGuestData {
  /** Cuid token used in the URL (?g=<token>). */
  token: string;
  /** Display name. */
  name: string;
  /** Optional companion name. */
  companion?: string;
  /** Free-form table label, e.g. "7" or "Mesa Os Amigos". */
  tableLabel: string;
  /** Optional host note for this guest. */
  note?: string;
  /** Whether this guest can invite secondary guests. */
  canInviteOthers: boolean;
  /** The slug of the invitation this guest belongs to. */
  invitationSlug: string;
}

/** Full guest data — used by host/admin management UI and APIs. */
export interface GuestData extends PublicGuestData {
  id: string;
  slugifiedName: string;
  phoneCountryCode: string;
  phoneNumber: string;
  /** Token of the inviter, when this guest was self-registered. */
  invitedById?: string;
  /** Display name of the inviter, when known. */
  invitedByName?: string;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

/** Input shape used by both admin and owner-token APIs to create/update guests. */
export interface GuestUpsertInput {
  name: string;
  companion?: string;
  phoneCountryCode: string;
  phoneNumber: string;
  tableLabel: string;
  canInviteOthers?: boolean;
  note?: string;
}
```

Then modify the existing `InvitationData` interface to add three new fields. Find the closing of the interface (around line 456 in the current file, just before `}` of `InvitationData`) and add the new fields just before the closing `}`:

```typescript
  /** Whether the guest-management feature is active for this invitation. */
  guestManagementEnabled?: boolean;
  /** WhatsApp/SMS message template with `{name}` and `{link}` placeholders. */
  guestMessageTemplate?: string;
  /** When the page was opened with `?g=<token>`, the matched guest. */
  guest?: PublicGuestData;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: passes (no type errors). If it fails because of unrelated existing errors, ignore those and only ensure no new errors mention `lib/types.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat(types): add Guest types and extend InvitationData with guest fields"
```

---

## Task 5: Implement `lib/guests.ts` — server-side data access

**Files:**
- Create: `lib/guests.ts`

- [ ] **Step 1: Create `lib/guests.ts`**

```typescript
import { prisma } from "./db";
import { slugifyName, DEFAULT_COUNTRY_CODE, DEFAULT_GUEST_MESSAGE_TEMPLATE } from "./guest-links";
import type {
  GuestData,
  GuestUpsertInput,
  PublicGuestData,
} from "./types";

// ---------------------------------------------------------------------------
// Internal: shape Prisma row → GuestData
// ---------------------------------------------------------------------------

type GuestRow = {
  id: string;
  invitationSlug: string;
  token: string;
  name: string;
  slugifiedName: string;
  companion: string | null;
  phoneCountryCode: string;
  phoneNumber: string;
  tableLabel: string;
  canInviteOthers: boolean;
  note: string | null;
  invitedById: string | null;
  invitedBy: { name: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

function toGuestData(row: GuestRow): GuestData {
  return {
    id: row.id,
    invitationSlug: row.invitationSlug,
    token: row.token,
    name: row.name,
    slugifiedName: row.slugifiedName,
    companion: row.companion ?? undefined,
    phoneCountryCode: row.phoneCountryCode,
    phoneNumber: row.phoneNumber,
    tableLabel: row.tableLabel,
    canInviteOthers: row.canInviteOthers,
    note: row.note ?? undefined,
    invitedById: row.invitedById ?? undefined,
    invitedByName: row.invitedBy?.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPublicGuestData(row: Pick<
  GuestRow,
  "token" | "name" | "companion" | "tableLabel" | "note" | "canInviteOthers" | "invitationSlug"
>): PublicGuestData {
  return {
    token: row.token,
    name: row.name,
    companion: row.companion ?? undefined,
    tableLabel: row.tableLabel,
    note: row.note ?? undefined,
    canInviteOthers: row.canInviteOthers,
    invitationSlug: row.invitationSlug,
  };
}

const includeInviter = {
  invitedBy: { select: { name: true } },
} as const;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export class GuestValidationError extends Error {
  field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = "GuestValidationError";
    this.field = field;
  }
}

function validateUpsert(input: GuestUpsertInput): void {
  if (!input.name || input.name.trim().length === 0) {
    throw new GuestValidationError("Nome é obrigatório", "name");
  }
  if (!input.phoneCountryCode || !input.phoneCountryCode.startsWith("+")) {
    throw new GuestValidationError("Indicativo inválido", "phoneCountryCode");
  }
  const digits = (input.phoneNumber ?? "").replace(/[^0-9]/g, "");
  if (digits.length < 6 || digits.length > 15) {
    throw new GuestValidationError(
      "Telefone deve ter entre 6 e 15 dígitos",
      "phoneNumber",
    );
  }
  if (!input.tableLabel || input.tableLabel.trim().length === 0) {
    throw new GuestValidationError("Mesa é obrigatória", "tableLabel");
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getGuestByToken(
  token: string,
): Promise<GuestData | null> {
  const row = await prisma.guest.findUnique({
    where: { token },
    include: includeInviter,
  });
  return row ? toGuestData(row as unknown as GuestRow) : null;
}

export async function getPublicGuestByToken(
  token: string,
): Promise<PublicGuestData | null> {
  const row = await prisma.guest.findUnique({
    where: { token },
    select: {
      token: true,
      name: true,
      companion: true,
      tableLabel: true,
      note: true,
      canInviteOthers: true,
      invitationSlug: true,
    },
  });
  return row ? toPublicGuestData(row) : null;
}

export async function getGuestsForInvitation(
  invitationSlug: string,
): Promise<GuestData[]> {
  const rows = await prisma.guest.findMany({
    where: { invitationSlug },
    include: includeInviter,
    orderBy: [{ createdAt: "asc" }],
  });
  return (rows as unknown as GuestRow[]).map(toGuestData);
}

export async function createGuest(
  invitationSlug: string,
  input: GuestUpsertInput,
  options?: { invitedById?: string },
): Promise<GuestData> {
  validateUpsert(input);
  const row = await prisma.guest.create({
    data: {
      invitationSlug,
      name: input.name.trim(),
      slugifiedName: slugifyName(input.name),
      companion: input.companion?.trim() || null,
      phoneCountryCode: input.phoneCountryCode,
      phoneNumber: input.phoneNumber.replace(/\s+/g, ""),
      tableLabel: input.tableLabel.trim(),
      canInviteOthers: input.canInviteOthers ?? false,
      note: input.note?.trim() || null,
      invitedById: options?.invitedById ?? null,
    },
    include: includeInviter,
  });
  return toGuestData(row as unknown as GuestRow);
}

export async function updateGuest(
  guestId: string,
  input: Partial<GuestUpsertInput>,
): Promise<GuestData> {
  // Validate only the fields that were provided
  if (input.name !== undefined) {
    if (!input.name || input.name.trim().length === 0) {
      throw new GuestValidationError("Nome é obrigatório", "name");
    }
  }
  if (input.phoneCountryCode !== undefined && !input.phoneCountryCode.startsWith("+")) {
    throw new GuestValidationError("Indicativo inválido", "phoneCountryCode");
  }
  if (input.phoneNumber !== undefined) {
    const digits = input.phoneNumber.replace(/[^0-9]/g, "");
    if (digits.length < 6 || digits.length > 15) {
      throw new GuestValidationError(
        "Telefone deve ter entre 6 e 15 dígitos",
        "phoneNumber",
      );
    }
  }
  if (input.tableLabel !== undefined && input.tableLabel.trim().length === 0) {
    throw new GuestValidationError("Mesa é obrigatória", "tableLabel");
  }

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) {
    data.name = input.name.trim();
    data.slugifiedName = slugifyName(input.name);
  }
  if (input.companion !== undefined) {
    data.companion = input.companion?.trim() || null;
  }
  if (input.phoneCountryCode !== undefined) data.phoneCountryCode = input.phoneCountryCode;
  if (input.phoneNumber !== undefined) data.phoneNumber = input.phoneNumber.replace(/\s+/g, "");
  if (input.tableLabel !== undefined) data.tableLabel = input.tableLabel.trim();
  if (input.canInviteOthers !== undefined) data.canInviteOthers = input.canInviteOthers;
  if (input.note !== undefined) data.note = input.note?.trim() || null;

  const row = await prisma.guest.update({
    where: { id: guestId },
    data,
    include: includeInviter,
  });
  return toGuestData(row as unknown as GuestRow);
}

export async function deleteGuest(guestId: string): Promise<void> {
  await prisma.guest.delete({ where: { id: guestId } });
}

/**
 * Self-register a secondary guest using a primary guest's token.
 *
 * Rules:
 *  - inviter must exist
 *  - inviter must have canInviteOthers === true
 *  - the invitation must have guestManagementEnabled === true
 *  - new guest is forced canInviteOthers = false (no chains)
 *  - phone fields are stored empty (host can fill later)
 */
export async function selfRegisterGuest(input: {
  inviterToken: string;
  name: string;
  companion?: string;
}): Promise<GuestData> {
  const inviter = await prisma.guest.findUnique({
    where: { token: input.inviterToken },
    include: { invitation: { select: { guestManagementEnabled: true } } },
  });
  if (!inviter) {
    throw new GuestValidationError("Convite não encontrado", "inviterToken");
  }
  if (!inviter.canInviteOthers) {
    throw new GuestValidationError(
      "Este convidado não pode convidar outras pessoas",
      "inviterToken",
    );
  }
  if (!inviter.invitation.guestManagementEnabled) {
    throw new GuestValidationError(
      "Gestão de convidados está desactivada",
      "inviterToken",
    );
  }
  if (!input.name || input.name.trim().length === 0) {
    throw new GuestValidationError("Nome é obrigatório", "name");
  }

  const row = await prisma.guest.create({
    data: {
      invitationSlug: inviter.invitationSlug,
      name: input.name.trim(),
      slugifiedName: slugifyName(input.name),
      companion: input.companion?.trim() || null,
      phoneCountryCode: DEFAULT_COUNTRY_CODE,
      phoneNumber: "",
      tableLabel: "",
      canInviteOthers: false,
      note: null,
      invitedById: inviter.id,
    },
    include: includeInviter,
  });
  return toGuestData(row as unknown as GuestRow);
}

// Re-export the default template so callers don't need to import from two modules
export { DEFAULT_GUEST_MESSAGE_TEMPLATE };
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors in `lib/guests.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/guests.ts
git commit -m "feat(guests): add server-side guest data access (lib/guests.ts)"
```

---

## Task 6: Add slugifier integration test (`tests/guests-slug.test.ts`)

**Files:**
- Create: `tests/guests-slug.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, expect, it } from "vitest";
import { slugifyName } from "../lib/guest-links";

// The slugifier in lib/guests.ts re-uses `slugifyName` from
// lib/guest-links.ts. This file pins down the exact behaviour we depend on
// for the `slugifiedName` DB column and the `?n=` URL param across a wider
// range of inputs than the guest-links test covers.

describe("slugifyName — extended cases", () => {
  it("handles plain ASCII names", () => {
    expect(slugifyName("Maria Silva")).toBe("maria-silva");
  });

  it("strips diacritics", () => {
    expect(slugifyName("José")).toBe("jose");
    expect(slugifyName("Conceição da Silva")).toBe("conceicao-da-silva");
  });

  it("collapses repeated whitespace and dashes", () => {
    expect(slugifyName("João  Pedro")).toBe("joao-pedro");
    expect(slugifyName("Ana--Beatriz")).toBe("ana-beatriz");
  });

  it("trims leading/trailing whitespace", () => {
    expect(slugifyName("  trim me  ")).toBe("trim-me");
  });

  it("returns empty string for empty / dash-only input", () => {
    expect(slugifyName("")).toBe("");
    expect(slugifyName("---")).toBe("");
  });

  it("strips symbols", () => {
    expect(slugifyName("João & Maria")).toBe("joao-maria");
  });

  it("preserves digits", () => {
    expect(slugifyName("Numbers 123")).toBe("numbers-123");
  });

  it("lowercases ASCII", () => {
    expect(slugifyName("UPPER CASE")).toBe("upper-case");
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run tests/guests-slug.test.ts`

Expected: 8 passing tests under the `slugifyName — extended cases` describe block.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`

Expected: all 5 test files pass.

- [ ] **Step 4: Commit**

```bash
git add tests/guests-slug.test.ts
git commit -m "test(guests): pin slugifier behaviour"
```

---

## Task 7: Update `lib/invitations.ts` to surface new fields

**Files:**
- Modify: `lib/invitations.ts`

- [ ] **Step 1: Extend the `InvitationWithTheme` row type**

In `lib/invitations.ts`, the `InvitationWithTheme` type (around lines 20–51) needs three new fields. Add them just before the closing `};`:

```typescript
type InvitationWithTheme = {
  id: string;
  slug: string;
  themeId: string;
  theme: { name: string };
  couple: unknown;
  date: unknown;
  quote: string;
  location: unknown;
  location2: unknown;
  rsvp: unknown;
  schedule: unknown;
  dressCode: unknown;
  giftRegistry: unknown;
  audio: unknown;
  heroImage: string;
  videoUrl: string | null;
  faqs: unknown;
  guestGuide: unknown;
  envelope: unknown;
  saveDateStyle: string | null;
  cinematicImageUrl: string | null;
  sectionImages: unknown;
  parents: unknown;
  ourStory: unknown;
  invitationType: string;
  externalLink: string | null;
  textStyles: unknown;
  cardStyles: unknown;
  imageSettings: unknown;
  customTexts: unknown;
  guestManagementEnabled: boolean;
  guestMessageTemplate: string | null;
};
```

- [ ] **Step 2: Map the new fields in `toInvitationData`**

Inside `toInvitationData`, add the two new fields just before the closing `}`:

```typescript
    customTexts: (row.customTexts as CustomTexts | null) ?? undefined,
    guestManagementEnabled: row.guestManagementEnabled ?? false,
    guestMessageTemplate: row.guestMessageTemplate ?? undefined,
  };
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/invitations.ts
git commit -m "feat(invitations): expose guestManagementEnabled and message template"
```

---

## Task 8: Persist `guestManagementEnabled` + `guestMessageTemplate` in admin invitation API

**Files:**
- Modify: `app/api/admin/invitations/route.ts`
- Modify: `app/api/admin/invitations/[id]/route.ts`

- [ ] **Step 1: Update the POST handler in `app/api/admin/invitations/route.ts`**

In the `prisma.invitation.create` call, add the two new fields just below `customTexts: sanitizeJsonField(body.customTexts, null),`:

```typescript
        customTexts: sanitizeJsonField(body.customTexts, null),
        guestManagementEnabled: body.guestManagementEnabled === true,
        guestMessageTemplate: body.guestMessageTemplate ?? null,
      },
```

- [ ] **Step 2: Update the PUT handler in `app/api/admin/invitations/[id]/route.ts`**

In the `prisma.invitation.update` data object, add the two conditional spreads just below the `customTexts` block:

```typescript
        ...(body.customTexts !== undefined && {
          customTexts: sanitizeJsonField(body.customTexts, null),
        }),
        ...(body.guestManagementEnabled !== undefined && {
          guestManagementEnabled: body.guestManagementEnabled === true,
        }),
        ...(body.guestMessageTemplate !== undefined && {
          guestMessageTemplate: body.guestMessageTemplate || null,
        }),
      },
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/invitations/route.ts app/api/admin/invitations/[id]/route.ts
git commit -m "feat(api): admin invitation routes persist guest-management fields"
```

---

## Task 9: Owner-token guest API — list & create

**Files:**
- Create: `app/api/owner/[token]/guests/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  GuestValidationError,
  createGuest,
  getGuestsForInvitation,
} from "@/lib/guests";

const upsertSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  companion: z.string().optional(),
  phoneCountryCode: z.string().min(2),
  phoneNumber: z.string().min(1),
  tableLabel: z.string().min(1, "Mesa é obrigatória"),
  canInviteOthers: z.boolean().optional(),
  note: z.string().optional(),
});

async function resolveOwner(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { ownerToken: token },
    select: { slug: true, guestManagementEnabled: true },
  });
  return invitation;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const inv = await resolveOwner(token);
  if (!inv) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }
  const guests = await getGuestsForInvitation(inv.slug);
  return NextResponse.json({
    guests,
    invitationSlug: inv.slug,
    guestManagementEnabled: inv.guestManagementEnabled,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const inv = await resolveOwner(token);
  if (!inv) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }
  if (!inv.guestManagementEnabled) {
    return NextResponse.json(
      { error: "Guest management is disabled for this invitation" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation error",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const guest = await createGuest(inv.slug, parsed.data);
    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    if (error instanceof GuestValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 },
      );
    }
    console.error("[Owner Guests API] Error creating guest:", error);
    return NextResponse.json({ error: "Failed to create guest" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Smoke-test the route**

Start the dev server in another terminal: `npm run dev`. Then in this shell, find an invitation's `ownerToken` from the DB:

Run: `npx tsx -e "import('./lib/generated/prisma/client.js').then(async ({PrismaClient}) => { const p = new PrismaClient(); const inv = await p.invitation.findFirst({ select: { slug: true, ownerToken: true, guestManagementEnabled: true } }); console.log(inv); await p.\$disconnect(); })"`

Expected: prints `{ slug: '...', ownerToken: '...', guestManagementEnabled: false }`.

Try GET (should succeed):

Run: `curl -s http://localhost:3000/api/owner/<paste-ownerToken>/guests | head -c 200`

Expected: JSON with `"guests":[]`, `"guestManagementEnabled":false`.

Try POST (should fail with 403 because feature is disabled):

Run:
```bash
curl -s -X POST http://localhost:3000/api/owner/<paste-ownerToken>/guests \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phoneCountryCode":"+258","phoneNumber":"841234567","tableLabel":"7"}'
```

Expected: `{"error":"Guest management is disabled for this invitation"}` with HTTP 403.

Stop the dev server (Ctrl+C in the other terminal).

- [ ] **Step 4: Commit**

```bash
git add app/api/owner/[token]/guests/route.ts
git commit -m "feat(api): owner-token guest list+create endpoints"
```

---

## Task 10: Owner-token guest API — update & delete

**Files:**
- Create: `app/api/owner/[token]/guests/[guestId]/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  GuestValidationError,
  deleteGuest,
  updateGuest,
} from "@/lib/guests";

const updateSchema = z
  .object({
    name: z.string().min(1).optional(),
    companion: z.string().optional(),
    phoneCountryCode: z.string().min(2).optional(),
    phoneNumber: z.string().min(1).optional(),
    tableLabel: z.string().min(1).optional(),
    canInviteOthers: z.boolean().optional(),
    note: z.string().optional(),
  })
  .strict();

async function resolveOwnerAndGuest(token: string, guestId: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { ownerToken: token },
    select: { slug: true, guestManagementEnabled: true },
  });
  if (!invitation) return { error: "not-found" as const };

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { id: true, invitationSlug: true },
  });
  if (!guest) return { error: "not-found" as const };
  if (guest.invitationSlug !== invitation.slug) {
    return { error: "forbidden" as const };
  }
  return { invitation, guest };
}

function errorResponse(kind: "not-found" | "forbidden") {
  if (kind === "not-found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; guestId: string }> },
) {
  const { token, guestId } = await params;
  const ctx = await resolveOwnerAndGuest(token, guestId);
  if ("error" in ctx) return errorResponse(ctx.error);
  if (!ctx.invitation.guestManagementEnabled) {
    return NextResponse.json(
      { error: "Guest management is disabled for this invitation" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation error",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const updated = await updateGuest(guestId, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof GuestValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 },
      );
    }
    console.error("[Owner Guests API] Error updating guest:", error);
    return NextResponse.json({ error: "Failed to update guest" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string; guestId: string }> },
) {
  const { token, guestId } = await params;
  const ctx = await resolveOwnerAndGuest(token, guestId);
  if ("error" in ctx) return errorResponse(ctx.error);

  try {
    await deleteGuest(guestId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Owner Guests API] Error deleting guest:", error);
    return NextResponse.json({ error: "Failed to delete guest" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/owner/[token]/guests/[guestId]/route.ts
git commit -m "feat(api): owner-token guest update+delete endpoints"
```

---

## Task 11: Admin guest API — list, create, update, delete

**Files:**
- Create: `app/api/admin/invitations/[id]/guests/route.ts`
- Create: `app/api/admin/invitations/[id]/guests/[guestId]/route.ts`

- [ ] **Step 1: Create the list/create route**

`app/api/admin/invitations/[id]/guests/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  GuestValidationError,
  createGuest,
  getGuestsForInvitation,
} from "@/lib/guests";

const upsertSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  companion: z.string().optional(),
  phoneCountryCode: z.string().min(2),
  phoneNumber: z.string().min(1),
  tableLabel: z.string().min(1, "Mesa é obrigatória"),
  canInviteOthers: z.boolean().optional(),
  note: z.string().optional(),
});

async function resolveInvitation(id: string) {
  return prisma.invitation.findUnique({
    where: { id },
    select: { slug: true, guestManagementEnabled: true },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const inv = await resolveInvitation(id);
  if (!inv) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }
  const guests = await getGuestsForInvitation(inv.slug);
  return NextResponse.json({
    guests,
    invitationSlug: inv.slug,
    guestManagementEnabled: inv.guestManagementEnabled,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const inv = await resolveInvitation(id);
  if (!inv) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation error",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    // Note: admin can create guests even when feature is disabled (so they can
    // prepare the list before the host turns the feature on).
    const guest = await createGuest(inv.slug, parsed.data);
    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    if (error instanceof GuestValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 },
      );
    }
    console.error("[Admin Guests API] Error creating guest:", error);
    return NextResponse.json({ error: "Failed to create guest" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the per-guest route**

`app/api/admin/invitations/[id]/guests/[guestId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  GuestValidationError,
  deleteGuest,
  updateGuest,
} from "@/lib/guests";

const updateSchema = z
  .object({
    name: z.string().min(1).optional(),
    companion: z.string().optional(),
    phoneCountryCode: z.string().min(2).optional(),
    phoneNumber: z.string().min(1).optional(),
    tableLabel: z.string().min(1).optional(),
    canInviteOthers: z.boolean().optional(),
    note: z.string().optional(),
  })
  .strict();

async function resolveInvitationAndGuest(id: string, guestId: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!invitation) return { error: "not-found" as const };

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { id: true, invitationSlug: true },
  });
  if (!guest) return { error: "not-found" as const };
  if (guest.invitationSlug !== invitation.slug) {
    return { error: "forbidden" as const };
  }
  return { invitation, guest };
}

function errorResponse(kind: "not-found" | "forbidden") {
  if (kind === "not-found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> },
) {
  const { id, guestId } = await params;
  const ctx = await resolveInvitationAndGuest(id, guestId);
  if ("error" in ctx) return errorResponse(ctx.error);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation error",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const updated = await updateGuest(guestId, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof GuestValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 },
      );
    }
    console.error("[Admin Guests API] Error updating guest:", error);
    return NextResponse.json({ error: "Failed to update guest" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> },
) {
  const { id, guestId } = await params;
  const ctx = await resolveInvitationAndGuest(id, guestId);
  if ("error" in ctx) return errorResponse(ctx.error);

  try {
    await deleteGuest(guestId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Guests API] Error deleting guest:", error);
    return NextResponse.json({ error: "Failed to delete guest" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/invitations/[id]/guests/
git commit -m "feat(api): admin CRUD endpoints for invitation guests"
```

---

## Task 12: Public guest lookup endpoint (`/api/guests/by-token/[token]`)

**Files:**
- Create: `app/api/guests/by-token/[token]/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublicGuestByToken } from "@/lib/guests";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const guest = await getPublicGuestByToken(token);
  if (!guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  // Verify the guest's invitation has the feature enabled — otherwise
  // do not surface the personalization at all.
  const invitation = await prisma.invitation.findUnique({
    where: { slug: guest.invitationSlug },
    select: { guestManagementEnabled: true },
  });
  if (!invitation || !invitation.guestManagementEnabled) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  return NextResponse.json(guest);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/guests/by-token/[token]/route.ts
git commit -m "feat(api): public guest lookup by token (minimal fields)"
```

---

## Task 13: Self-registration endpoint (`/api/guests/self-register`)

**Files:**
- Create: `app/api/guests/self-register/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GuestValidationError, selfRegisterGuest } from "@/lib/guests";
import { buildPersonalInviteUrl } from "@/lib/guest-links";

const schema = z.object({
  inviterToken: z.string().min(1),
  name: z.string().min(1, "Nome é obrigatório"),
  companion: z.string().optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation error",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const guest = await selfRegisterGuest(parsed.data);

    // Build the personal URL so the inviter can copy/share it
    const origin = request.nextUrl.origin;
    const personalUrl = buildPersonalInviteUrl({
      origin,
      slug: guest.invitationSlug,
      token: guest.token,
      name: guest.name,
    });

    return NextResponse.json(
      {
        guest: {
          token: guest.token,
          name: guest.name,
          companion: guest.companion,
          invitationSlug: guest.invitationSlug,
        },
        personalUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof GuestValidationError) {
      const status = error.field === "inviterToken" ? 403 : 400;
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status },
      );
    }
    console.error("[Self-Register] Error:", error);
    return NextResponse.json({ error: "Failed to register guest" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/guests/self-register/route.ts
git commit -m "feat(api): public self-registration endpoint for secondary guests"
```

---

## Task 14: Modify `/api/rsvp` to accept and link `guestToken`

**Files:**
- Modify: `app/api/rsvp/route.ts`

- [ ] **Step 1: Update `app/api/rsvp/route.ts`**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const rsvpSchema = z.object({
  invitationSlug: z.string().min(1, "Slug do convite é obrigatório"),
  guestName: z.string().min(1, "Nome é obrigatório"),
  email: z.email("Email inválido").optional(),
  attending: z.boolean({ error: "Confirmação de presença é obrigatória" }),
  dietaryRestrictions: z.string().optional(),
  message: z.string().optional(),
  /** Optional guest token from `?g=<token>` link — links the RSVP to a Guest. */
  guestToken: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/rsvp
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = rsvpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados inválidos",
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const data = result.data;

    // Verify that the invitation exists
    const invitation = await prisma.invitation.findUnique({
      where: { slug: data.invitationSlug },
      select: { slug: true },
    });

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          message: "Convite não encontrado",
        },
        { status: 404 },
      );
    }

    // If a guestToken is provided, validate it belongs to this invitation
    let guestId: string | null = null;
    if (data.guestToken) {
      const guest = await prisma.guest.findUnique({
        where: { token: data.guestToken },
        select: { id: true, invitationSlug: true },
      });
      if (!guest || guest.invitationSlug !== invitation.slug) {
        return NextResponse.json(
          {
            success: false,
            message: "Convidado não pertence a este convite",
          },
          { status: 400 },
        );
      }
      guestId = guest.id;
    }

    // Persist to database
    await prisma.rsvpResponse.create({
      data: {
        invitationSlug: data.invitationSlug,
        guestName: data.guestName,
        email: data.email ?? null,
        attending: data.attending,
        dietaryRestrictions: data.dietaryRestrictions ?? null,
        message: data.message ?? null,
        guestId,
      },
    });

    console.log(
      "[RSVP] Saved:",
      data.guestName,
      "for",
      data.invitationSlug,
      guestId ? `(guestId=${guestId})` : "",
    );

    return NextResponse.json({
      success: true,
      message: "RSVP confirmado!",
    });
  } catch (error) {
    console.error("[RSVP] Error processing request:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/rsvp/route.ts
git commit -m "feat(api): RSVP endpoint accepts and links guestToken"
```

---

## Task 15: Build the reusable `<GuestRowActions>` component

**Files:**
- Create: `components/admin/GuestRowActions.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { Copy, MessageCircle, Phone, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  buildPersonalInviteUrl,
  buildSmsUrl,
  buildWhatsAppUrl,
  renderMessageTemplate,
} from "@/lib/guest-links";
import type { GuestData } from "@/lib/types";

interface GuestRowActionsProps {
  guest: GuestData;
  invitationSlug: string;
  invitationOrigin: string;
  messageTemplate: string;
  onEdit: (guest: GuestData) => void;
  onDelete: (guest: GuestData) => void;
}

export default function GuestRowActions({
  guest,
  invitationSlug,
  invitationOrigin,
  messageTemplate,
  onEdit,
  onDelete,
}: GuestRowActionsProps) {
  const personalUrl = buildPersonalInviteUrl({
    origin: invitationOrigin,
    slug: invitationSlug,
    token: guest.token,
    name: guest.name,
  });
  const message = renderMessageTemplate(messageTemplate, {
    name: guest.name,
    link: personalUrl,
  });
  const waUrl = buildWhatsAppUrl({
    countryCode: guest.phoneCountryCode,
    phoneNumber: guest.phoneNumber,
    message,
  });
  const smsUrl = buildSmsUrl({
    countryCode: guest.phoneCountryCode,
    phoneNumber: guest.phoneNumber,
    message,
  });

  const hasPhone = !!guest.phoneNumber;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(personalUrl);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleCopy}
              aria-label="Copiar link pessoal"
            >
              <Copy className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent>Copiar link pessoal</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={!hasPhone}
              onClick={() => window.open(waUrl, "_blank", "noopener,noreferrer")}
              aria-label="Abrir WhatsApp"
            >
              <MessageCircle className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent>{hasPhone ? "Abrir WhatsApp" : "Sem telefone"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={!hasPhone}
              onClick={() => window.open(smsUrl, "_blank", "noopener,noreferrer")}
              aria-label="Abrir SMS"
            >
              <Phone className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent>{hasPhone ? "Enviar SMS" : "Sem telefone"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onEdit(guest)}
              aria-label="Editar convidado"
            >
              <Pencil className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(guest)}
              aria-label="Apagar convidado"
            >
              <Trash2 className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent>Apagar</TooltipContent>
      </Tooltip>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/admin/GuestRowActions.tsx
git commit -m "feat(ui): add GuestRowActions component (copy/whatsapp/sms/edit/delete)"
```

---

## Task 16: Build the `<GuestForm>` component (Add/Edit form inside a Sheet)

**Files:**
- Create: `components/admin/GuestForm.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from "@/lib/guest-links";
import type { GuestData, GuestUpsertInput } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  companion: z.string().optional(),
  phoneCountryCode: z.string().min(2),
  phoneNumber: z
    .string()
    .min(1, "Telefone é obrigatório")
    .refine((v) => v.replace(/[^0-9]/g, "").length >= 6 && v.replace(/[^0-9]/g, "").length <= 15, {
      message: "Telefone deve ter entre 6 e 15 dígitos",
    }),
  tableLabel: z.string().min(1, "Mesa é obrigatória"),
  canInviteOthers: z.boolean(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface GuestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the form is in edit mode. */
  guest?: GuestData;
  onSubmit: (input: GuestUpsertInput) => Promise<void>;
  saving: boolean;
}

export default function GuestForm({
  open,
  onOpenChange,
  guest,
  onSubmit,
  saving,
}: GuestFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      companion: "",
      phoneCountryCode: DEFAULT_COUNTRY_CODE,
      phoneNumber: "",
      tableLabel: "",
      canInviteOthers: false,
      note: "",
    },
  });

  const { register, handleSubmit, reset, watch, setValue, formState } = form;

  // Sync form values when opening / switching guests
  useEffect(() => {
    if (!open) return;
    if (guest) {
      reset({
        name: guest.name,
        companion: guest.companion ?? "",
        phoneCountryCode: guest.phoneCountryCode || DEFAULT_COUNTRY_CODE,
        phoneNumber: guest.phoneNumber,
        tableLabel: guest.tableLabel,
        canInviteOthers: guest.canInviteOthers,
        note: guest.note ?? "",
      });
    } else {
      reset({
        name: "",
        companion: "",
        phoneCountryCode: DEFAULT_COUNTRY_CODE,
        phoneNumber: "",
        tableLabel: "",
        canInviteOthers: false,
        note: "",
      });
    }
  }, [open, guest, reset]);

  const countryCode = watch("phoneCountryCode");
  const canInviteOthers = watch("canInviteOthers");

  async function submit(values: FormValues) {
    await onSubmit({
      name: values.name,
      companion: values.companion?.trim() || undefined,
      phoneCountryCode: values.phoneCountryCode,
      phoneNumber: values.phoneNumber,
      tableLabel: values.tableLabel,
      canInviteOthers: values.canInviteOthers,
      note: values.note?.trim() || undefined,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{guest ? "Editar convidado" : "Adicionar convidado"}</SheetTitle>
          <SheetDescription>
            {guest
              ? "Actualiza os detalhes deste convidado."
              : "Preenche os detalhes do novo convidado."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(submit)}
          className="space-y-4 px-4 pb-4"
          id="guest-form"
        >
          <div className="space-y-1.5">
            <Label htmlFor="guest-name">Nome *</Label>
            <Input id="guest-name" {...register("name")} autoFocus />
            {formState.errors.name && (
              <p className="text-xs text-destructive">{formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-companion">Acompanhante</Label>
            <Input id="guest-companion" {...register("companion")} />
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="guest-cc">Indicativo *</Label>
              <Select
                value={countryCode}
                onValueChange={(value) => setValue("phoneCountryCode", value, { shouldDirty: true })}
              >
                <SelectTrigger id="guest-cc">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="mr-1">{c.flag}</span>
                      <span className="font-mono text-xs">{c.code}</span>
                      <span className="ml-1 text-xs text-muted-foreground">{c.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest-phone">Telefone *</Label>
              <Input id="guest-phone" inputMode="tel" {...register("phoneNumber")} />
              {formState.errors.phoneNumber && (
                <p className="text-xs text-destructive">
                  {formState.errors.phoneNumber.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-table">Mesa *</Label>
            <Input
              id="guest-table"
              placeholder="Ex: Mesa 7 ou Os Amigos do Pedro"
              {...register("tableLabel")}
            />
            {formState.errors.tableLabel && (
              <p className="text-xs text-destructive">
                {formState.errors.tableLabel.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="cursor-pointer">Pode convidar mais pessoas</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quando activo, este convidado pode adicionar outros à lista a partir
                do convite pessoal.
              </p>
            </div>
            <Switch
              checked={canInviteOthers}
              onCheckedChange={(value) =>
                setValue("canInviteOthers", value, { shouldDirty: true })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-note">Nota</Label>
            <Textarea
              id="guest-note"
              rows={3}
              placeholder="Ex: Sem glúten, alergia a marisco, etc."
              {...register("note")}
            />
          </div>
        </form>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" form="guest-form" disabled={saving}>
            {saving && <Loader2 className="mr-1 size-3.5 animate-spin" />}
            {guest ? "Guardar" : "Adicionar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors. If `Sheet`/`SheetContent`/etc. are missing exports, run `npx shadcn@latest add sheet` once to confirm those primitives exist; the file `components/ui/sheet.tsx` already exists in this project.

- [ ] **Step 3: Commit**

```bash
git add components/admin/GuestForm.tsx
git commit -m "feat(ui): add GuestForm component (Sheet-based add/edit form)"
```

---

## Task 17: Build the `<GuestListEditor>` component

**Files:**
- Create: `components/admin/GuestListEditor.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import GuestForm from "./GuestForm";
import GuestRowActions from "./GuestRowActions";
import type { GuestData, GuestUpsertInput } from "@/lib/types";

interface GuestListEditorProps {
  /** Path used for list (GET) and create (POST). E.g. "/api/owner/<token>/guests" */
  apiBasePath: string;
  /** Used to construct per-guest paths: `${apiBasePath}/${guestId}`. */
  invitationSlug: string;
  invitationOrigin: string;
  messageTemplate: string;
  /** Optional: shown in the header. */
  title?: string;
}

export default function GuestListEditor({
  apiBasePath,
  invitationSlug,
  invitationOrigin,
  messageTemplate,
  title = "Convidados",
}: GuestListEditorProps) {
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GuestData | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GuestData | null>(null);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiBasePath, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch guests");
      const data = await res.json();
      setGuests(data.guests as GuestData[]);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar a lista de convidados.");
    } finally {
      setLoading(false);
    }
  }, [apiBasePath]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.companion ?? "").toLowerCase().includes(q) ||
        g.tableLabel.toLowerCase().includes(q),
    );
  }, [guests, search]);

  function openAdd() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(guest: GuestData) {
    setEditing(guest);
    setFormOpen(true);
  }

  async function handleSubmit(input: GuestUpsertInput) {
    setSaving(true);
    try {
      const url = editing ? `${apiBasePath}/${editing.id}` : apiBasePath;
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Falha ao guardar convidado");
      }
      toast.success(editing ? "Convidado actualizado" : "Convidado adicionado");
      setFormOpen(false);
      await fetchGuests();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${apiBasePath}/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao apagar convidado");
      toast.success("Convidado apagado");
      setDeleteTarget(null);
      await fetchGuests();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {guests.length} convidado{guests.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button type="button" onClick={openAdd}>
          <Plus className="mr-1 size-4" />
          Adicionar convidado
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Procurar por nome, acompanhante ou mesa…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          A carregar convidados…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <Users className="mx-auto size-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">
            {guests.length === 0
              ? "Nenhum convidado ainda"
              : "Nenhum convidado corresponde à pesquisa"}
          </p>
          {guests.length === 0 && (
            <Button type="button" variant="outline" className="mt-4" onClick={openAdd}>
              <Plus className="mr-1 size-3.5" />
              Adicionar primeiro convidado
            </Button>
          )}
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {filtered.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{g.name}</span>
                  {g.companion && (
                    <span className="text-sm text-muted-foreground">
                      &amp; {g.companion}
                    </span>
                  )}
                  {g.canInviteOthers && (
                    <Badge variant="secondary" className="text-[10px]">
                      Pode convidar
                    </Badge>
                  )}
                  {g.invitedByName && (
                    <Badge variant="outline" className="text-[10px]">
                      Convidado por {g.invitedByName}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>Mesa: {g.tableLabel || "—"}</span>
                  {g.phoneNumber && (
                    <span className="font-mono">
                      {g.phoneCountryCode} {g.phoneNumber}
                    </span>
                  )}
                  {g.note && <span className="italic">&ldquo;{g.note}&rdquo;</span>}
                </div>
              </div>
              <GuestRowActions
                guest={g}
                invitationSlug={invitationSlug}
                invitationOrigin={invitationOrigin}
                messageTemplate={messageTemplate}
                onEdit={openEdit}
                onDelete={(target) => setDeleteTarget(target)}
              />
            </li>
          ))}
        </ul>
      )}

      <GuestForm
        open={formOpen}
        onOpenChange={setFormOpen}
        guest={editing}
        onSubmit={handleSubmit}
        saving={saving}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar convidado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acção apaga {deleteTarget?.name} da lista. As confirmações já
              recebidas mantêm-se mas deixam de estar associadas a este convidado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/admin/GuestListEditor.tsx
git commit -m "feat(ui): add GuestListEditor (search, list, add/edit/delete)"
```

---

## Task 18: Add the "Gestão de Convidados" accordion section to admin form

**Files:**
- Modify: `app/admin/invitations/InvitationForm.tsx`

- [ ] **Step 1: Add the import for `GuestListEditor` and the default template**

Near the top of `app/admin/invitations/InvitationForm.tsx`, after the line `import { OwnerLinkPanel } from "./OwnerLinkPanel";`, add:

```typescript
import GuestListEditor from "@/components/admin/GuestListEditor";
import { DEFAULT_GUEST_MESSAGE_TEMPLATE } from "@/lib/guest-links";
```

- [ ] **Step 2: Extend the form state to track the new fields**

The component uses `const [form, setForm] = useState<InvitationData>(...)` (around line 387). The initializer expression builds the initial `InvitationData`-shaped object using fields like `customTexts: invitation?.customTexts ?? {}`. Find that initializer and add two new entries — search for the `customTexts:` line and add immediately after it:

```typescript
      customTexts: invitation?.customTexts ?? {},
      guestManagementEnabled: invitation?.guestManagementEnabled ?? false,
      guestMessageTemplate:
        invitation?.guestMessageTemplate ?? DEFAULT_GUEST_MESSAGE_TEMPLATE,
```

These match the new optional fields added to `InvitationData` in Task 4. The state setter is `setForm`.

- [ ] **Step 3: Add the accordion section**

Find the closing `</Accordion>` tag in the form (it will be the last `</AccordionItem>` before that). Just before the `</Accordion>`, add a new `<AccordionItem>`:

```tsx
              <AccordionItem
                value="guest-management"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Gestão de Convidados
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <Label className="cursor-pointer">
                        Activar gestão de convidados
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Quando activo, podes pré-registar convidados, gerar links
                        pessoais e enviar convites por WhatsApp ou SMS.
                      </p>
                    </div>
                    <Switch
                      checked={form.guestManagementEnabled === true}
                      onCheckedChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          guestManagementEnabled: value,
                        }))
                      }
                    />
                  </div>

                  {form.guestManagementEnabled && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="guest-msg-template">
                          Mensagem de convite (template)
                        </Label>
                        <Textarea
                          id="guest-msg-template"
                          rows={3}
                          value={
                            form.guestMessageTemplate ?? DEFAULT_GUEST_MESSAGE_TEMPLATE
                          }
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              guestMessageTemplate: e.target.value,
                            }))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Usa <code>{"{name}"}</code> para o nome do convidado e{" "}
                          <code>{"{link}"}</code> para o link pessoal.
                        </p>
                      </div>

                      {invitation?.id ? (
                        <div className="rounded-lg border p-3">
                          <GuestListEditor
                            apiBasePath={`/api/admin/invitations/${invitation.id}/guests`}
                            invitationSlug={form.slug}
                            invitationOrigin={
                              typeof window !== "undefined"
                                ? window.location.origin
                                : ""
                            }
                            messageTemplate={
                              form.guestMessageTemplate ??
                              DEFAULT_GUEST_MESSAGE_TEMPLATE
                            }
                            title="Lista de convidados"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Guarda o convite primeiro para gerir a lista de convidados.
                        </p>
                      )}
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
```

Note: this references `form.guestManagementEnabled`, `form.guestMessageTemplate`, `form.slug`, and `invitation?.id`. The first two come from Step 2; the last two already exist on the form's data shape. If the form uses a different state-setter name (e.g. `setFormData` or `update`), substitute it accordingly — search the file for `setForm((prev)` or similar to see the existing pattern and match it exactly.

- [ ] **Step 4: Ensure the new fields are sent in the save payload**

Search the file for the request body that's POSTed/PUT to `/api/admin/invitations`. The handler typically calls `fetch(...)` with `body: JSON.stringify({ ...form, themeId: ... })` or similar — confirm the new fields are forwarded via the spread of `form`. If the payload is built field-by-field instead of via spread, explicitly add to the body object:

```typescript
        guestManagementEnabled: form.guestManagementEnabled === true,
        guestMessageTemplate: form.guestMessageTemplate ?? null,
```

Since `form` is typed as `InvitationData` (which now includes both fields from Task 4), a clean `{ ...form }` spread is sufficient.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit`

Expected: no errors.

Run: `npm run lint`

Expected: passes.

- [ ] **Step 6: Manual smoke test**

Start dev server: `npm run dev`. Open `/admin/invitations`, edit an existing invitation, scroll to the new "Gestão de Convidados" accordion, toggle it on, save, refresh the page, verify the toggle is still on. Stop dev server.

- [ ] **Step 7: Commit**

```bash
git add app/admin/invitations/InvitationForm.tsx
git commit -m "feat(admin): add guest-management section to InvitationForm"
```

---

## Task 19: Build `<PersonalGuestCard>` for the public invite

**Files:**
- Create: `components/shared/PersonalGuestCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, MessageCircle, UserPlus } from "lucide-react";

import type { PublicGuestData, TemplateTheme } from "@/lib/types";
import InviteOthersModal from "./InviteOthersModal";

interface PersonalGuestCardProps {
  guest: PublicGuestData;
  theme: TemplateTheme;
}

export default function PersonalGuestCard({
  guest,
  theme,
}: PersonalGuestCardProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
        className="relative px-6 py-12"
        style={{ zIndex: 2 }}
      >
        <div
          className="mx-auto max-w-md rounded-3xl border px-6 py-8 text-center backdrop-blur-sm"
          style={{
            background: theme.cardBg,
            borderColor: theme.cardBorder,
          }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.3em]"
            style={{ color: theme.textMuted, fontFamily: theme.uiFont }}
          >
            — Convite Pessoal —
          </p>

          <h2
            className="mt-4 text-3xl leading-tight"
            style={{
              fontFamily: theme.displayFont,
              color: theme.textPrimary,
            }}
          >
            Olá, {guest.name}
          </h2>

          {guest.companion && (
            <p
              className="mt-1 text-sm"
              style={{
                fontFamily: theme.bodyFont,
                color: theme.textSecondary,
              }}
            >
              &amp; {guest.companion}
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoPill
              icon={<Users className="size-3.5" />}
              label="Mesa"
              value={guest.tableLabel}
              theme={theme}
            />
            {guest.note && (
              <InfoPill
                icon={<MessageCircle className="size-3.5" />}
                label="Nota"
                value={guest.note}
                theme={theme}
                multiline
              />
            )}
          </div>

          {guest.canInviteOthers && (
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs uppercase tracking-widest transition-colors hover:opacity-80"
              style={{
                borderColor: theme.ctaSecondaryBorder,
                color: theme.ctaSecondaryText,
                fontFamily: theme.uiFont,
                borderRadius: theme.ctaRadius,
              }}
            >
              <UserPlus className="size-3.5" />
              Convidar mais pessoas
            </button>
          )}
        </div>
      </motion.section>

      <InviteOthersModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        inviterToken={guest.token}
        theme={theme}
      />
    </>
  );
}

function InfoPill({
  icon,
  label,
  value,
  theme,
  multiline = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  theme: TemplateTheme;
  multiline?: boolean;
}) {
  return (
    <div
      className="flex items-start gap-2 rounded-2xl border px-4 py-3 text-left"
      style={{
        borderColor: theme.cardBorder,
        background: "rgba(255,255,255,0.4)",
      }}
    >
      <span style={{ color: theme.accent }} className="mt-0.5">
        {icon}
      </span>
      <div className="min-w-0">
        <p
          className="text-[9px] uppercase tracking-widest"
          style={{ color: theme.textMuted, fontFamily: theme.uiFont }}
        >
          {label}
        </p>
        <p
          className="text-sm font-medium"
          style={{
            color: theme.textPrimary,
            fontFamily: theme.bodyFont,
            whiteSpace: multiline ? "pre-line" : "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check (will fail until next task creates `InviteOthersModal`)**

Run: `npx tsc --noEmit`

Expected: ONE error: `Cannot find module './InviteOthersModal'`. We'll fix this in the next task. Don't commit yet.

- [ ] **Step 3: Defer commit**

Do not commit yet — `<InviteOthersModal>` is created in Task 20 and we'll commit them together.

---

## Task 20: Build `<InviteOthersModal>`

**Files:**
- Create: `components/shared/InviteOthersModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Check, Copy, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import type { TemplateTheme } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  companion: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface InviteOthersModalProps {
  open: boolean;
  onClose: () => void;
  inviterToken: string;
  theme: TemplateTheme;
}

export default function InviteOthersModal({
  open,
  onClose,
  inviterToken,
  theme,
}: InviteOthersModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ name: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", companion: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/guests/self-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviterToken,
          name: values.name,
          companion: values.companion?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Falha ao registar convidado");
      }
      const data = await res.json();
      setResult({ name: data.guest.name, url: data.personalUrl });
      reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  function handleClose() {
    setResult(null);
    reset();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={handleClose}
          />

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl border bg-white px-6 py-7"
            style={{ borderColor: "#E5E5E3" }}
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar"
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-600"
            >
              <X className="size-5" />
            </button>

            {!result ? (
              <>
                <h3
                  className="text-xl font-semibold text-stone-800"
                  style={{ fontFamily: theme.displayFont }}
                >
                  Convidar mais pessoas
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  Adiciona o nome dos convidados extra. Receberás um link pessoal
                  para partilhar com cada um.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-stone-600">
                      Nome *
                    </label>
                    <input
                      {...register("name")}
                      className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-stone-400"
                      autoFocus
                    />
                    {formState.errors.name && (
                      <p className="text-xs text-red-600">
                        {formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-stone-600">
                      Acompanhante
                    </label>
                    <input
                      {...register("companion")}
                      className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-stone-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                    style={{
                      background: theme.ctaPrimaryBg,
                      color: theme.ctaPrimaryText,
                      borderRadius: theme.ctaRadius,
                    }}
                  >
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    Adicionar convidado
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check className="size-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-800">
                    Convidado adicionado!
                  </h3>
                </div>
                <p className="mt-3 text-sm text-stone-500">
                  Partilha este link pessoal com <strong>{result.name}</strong>:
                </p>

                <div className="mt-3 flex gap-2">
                  <input
                    readOnly
                    value={result.url}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className="shrink-0 rounded-lg border border-stone-200 px-3 py-2 text-xs hover:bg-stone-100"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="mt-5 w-full rounded-full border px-4 py-2.5 text-sm hover:bg-stone-50"
                >
                  Adicionar outro convidado
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit `<PersonalGuestCard>` and `<InviteOthersModal>` together**

```bash
git add components/shared/PersonalGuestCard.tsx components/shared/InviteOthersModal.tsx
git commit -m "feat(ui): add PersonalGuestCard and InviteOthersModal for personalized invites"
```

---

## Task 21: Wire `?g=<token>` lookup into the public invite page

**Files:**
- Modify: `app/[slug]/page.tsx`
- Modify: `app/[slug]/InvitationView.tsx`

- [ ] **Step 1: Update `app/[slug]/page.tsx` to read the guest token**

Replace the file contents with:

```typescript
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getInvitation } from "@/lib/invitations";
import { getPublicGuestByToken } from "@/lib/guests";
import { getTheme } from "@/lib/themes";
import InvitationView from "./InvitationView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await getInvitation(slug);

  if (!invitation) {
    return { title: "Convite não encontrado" };
  }

  const { bride, groom } = invitation.couple;

  return {
    title: `${bride} & ${groom} — Convite de Casamento`,
    description: `${bride} e ${groom} convidam você para celebrar o casamento em ${invitation.date.display}. ${invitation.quote}`,
    openGraph: {
      title: `${bride} & ${groom}`,
      description: `Casamento em ${invitation.date.display}`,
      images: invitation.heroImage ? [invitation.heroImage] : [],
    },
  };
}

export default async function InvitationSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ g?: string; n?: string }>;
}) {
  const { slug } = await params;
  const { g: guestToken } = await searchParams;

  const invitation = await getInvitation(slug);

  if (!invitation) {
    notFound();
  }

  const theme = await getTheme(invitation.template);

  if (!theme) {
    notFound();
  }

  // Look up the personal guest if a token was provided. Silently fall back
  // when the token does not exist, belongs to another invitation, or the
  // feature is disabled — the rest of the page still works normally.
  let guest = undefined;
  if (guestToken && invitation.guestManagementEnabled) {
    const found = await getPublicGuestByToken(guestToken);
    if (found && found.invitationSlug === slug) {
      guest = found;
    }
  }

  return (
    <InvitationView
      invitation={{ ...invitation, guest }}
      theme={theme}
    />
  );
}
```

- [ ] **Step 2: Update `app/[slug]/InvitationView.tsx`**

`InvitationView` already accepts `invitation: InvitationData`, and `InvitationData` now has the optional `guest` field (added in Task 4). It passes `invitation` to `InvitationPage`, which we'll modify in the next task. No code change is required in this file — verify by re-reading it:

Run: `grep -n "InvitationPage" app/[slug]/InvitationView.tsx`

Expected: shows that `InvitationView` renders `<InvitationPage invitation={invitation} ... />`.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/[slug]/page.tsx
git commit -m "feat(invite): read ?g=<token> server-side and forward guest data"
```

---

## Task 22: Render `<PersonalGuestCard>` inside the invitation page

**Files:**
- Modify: `components/shared/InvitationPage.tsx`

- [ ] **Step 1: Add the import**

In `components/shared/InvitationPage.tsx`, near the other imports for shared components (where `RSVPModal` is imported), add:

```typescript
import PersonalGuestCard from "./PersonalGuestCard";
```

- [ ] **Step 2: Render the card between hero and date sections**

Find the JSX that ends the hero section and starts the next section (look for the closing `</section>` of the hero — around the first `</section>` after the hero content, near line 480 of the file, or search for `1. Hero` and find the next section).

Insert immediately after the closing `</section>` of the hero, before the next section comment block:

```tsx
      {/* ================================================================= */}
      {/* Personal guest card — shown when ?g=<token> matches a guest       */}
      {/* ================================================================= */}
      {invitation.guest && (
        <PersonalGuestCard guest={invitation.guest} theme={theme} />
      )}
```

- [ ] **Step 3: Pass guest down to RSVP modal**

Find the `<RSVPModal ... />` invocation near the bottom of the file (around line 1486). Add a `guest` prop:

```tsx
      <RSVPModal
        open={rsvpOpen}
        onClose={() => {
          setRsvpOpen(false);
          // Refresh submitted state after modal closes
          try {
            const slugs: string[] = JSON.parse(
              localStorage.getItem(RSVP_SUBMITTED_SLUGS_KEY) ?? "[]",
            );
            setRsvpSubmitted(slugs.includes(invitation.slug));
          } catch {
            // ignore
          }
        }}
        invitation={invitation}
        theme={theme}
        customTexts={invitation.customTexts}
        guest={invitation.guest}
      />
```

- [ ] **Step 4: Type-check (will fail until next task adds the prop to `RSVPModal`)**

Run: `npx tsc --noEmit`

Expected: ONE error: property `guest` does not exist on `IntegrationProps`. We'll fix this in the next task.

- [ ] **Step 5: Defer commit**

Do not commit yet — Task 23 modifies the modal and we'll commit them together.

---

## Task 23: Modify `<RSVPModal>` to accept and use the guest

**Files:**
- Modify: `components/shared/RSVPModal.tsx`

- [ ] **Step 1: Extend `IntegrationProps`**

In `components/shared/RSVPModal.tsx`, find the `IntegrationProps` interface (around line 125). Add the `guest` prop:

```typescript
interface IntegrationProps {
  open: boolean;
  onClose: () => void;
  invitation: InvitationData;
  theme: TemplateTheme;
  customTexts?: CustomTexts;
  /** Override the API endpoint — defaults to "/api/rsvp" */
  apiEndpoint?: string;
  /** Override the slug field name sent in the body — defaults to "invitationSlug" */
  slugKey?: string;
  /** Optional pre-registered guest (from `?g=<token>` link). When present:
   *  - the form prefills the name (read-only)
   *  - the body includes `guestToken` so the server can link the RSVP to this guest
   *  - if the guest has a companion, a "+1" toggle is shown */
  guest?: import("@/lib/types").PublicGuestData;
}
```

- [ ] **Step 2: Add the `PublicGuestData` import**

Update the existing import from `@/lib/types`:

```typescript
import type { CustomTexts, InvitationData, PublicGuestData, TemplateTheme } from "@/lib/types";
```

(The inline `import("@/lib/types").PublicGuestData` from Step 1 then becomes just `PublicGuestData` — update it accordingly.)

The interface becomes:

```typescript
interface IntegrationProps {
  open: boolean;
  onClose: () => void;
  invitation: InvitationData;
  theme: TemplateTheme;
  customTexts?: CustomTexts;
  apiEndpoint?: string;
  slugKey?: string;
  guest?: PublicGuestData;
}
```

- [ ] **Step 3: Read the `guest` prop in the component body**

Just below the existing `const ct = isIntegration(props) ? props.customTexts : undefined;` line, add:

```typescript
  const guest = isIntegration(props) ? props.guest : undefined;
```

- [ ] **Step 4: Prefill the name and disable editing when `guest` is set**

Find the `useForm` call (around line 209). Update its `defaultValues` to use the guest's name when present:

```typescript
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RSVPFormData>({
    resolver: zodResolver(rsvpSchema) as unknown as Resolver<RSVPFormData>,
    defaultValues: {
      name: guest?.name ?? "",
      email: "",
      attending: undefined,
      dietaryRestrictions: "",
      message: "",
    },
  });
```

Then add a `useEffect` just below the form initialization that resets the name when `guest` changes:

```typescript
  useEffect(() => {
    if (guest?.name) {
      reset((prev) => ({ ...prev, name: guest.name }));
    }
  }, [guest?.name, reset]);
```

- [ ] **Step 5: Send `guestToken` in the request body**

In `onSubmit`, update the `body` to include `guestToken` when `guest` is present:

```typescript
  const onSubmit = async (data: RSVPFormData) => {
    setSubmitState("loading");
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [slugKey]: slug,
          guestName: data.name,
          email: data.email || undefined,
          attending: data.attending === "yes",
          dietaryRestrictions: data.dietaryRestrictions || undefined,
          message: data.message || undefined,
          guestToken: guest?.token,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      markRsvpSubmitted(slug);
      setSubmitState("success");
      reset();
    } catch {
      setSubmitState("error");
    }
  };
```

- [ ] **Step 6: Make the name input read-only when `guest` is set**

Find the JSX `<input>` for the `name` field (search for `{...register("name")}`). Add a conditional `readOnly` attribute and a hint:

```tsx
                  <input
                    {...register("name")}
                    type="text"
                    readOnly={!!guest}
                    className={`${inputClass} ${guest ? "cursor-not-allowed opacity-80" : ""}`}
                    style={inputStyle}
                    placeholder={t("rsvp_namePlaceholder", ct)}
                  />
```

Adjust the snippet to match the exact existing JSX (preserving any other props/classes already there). The key changes are: add `readOnly={!!guest}` and add an optional opacity class when `guest` is set.

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 8: Commit `InvitationPage` + `RSVPModal` changes together**

```bash
git add components/shared/InvitationPage.tsx components/shared/RSVPModal.tsx
git commit -m "feat(invite): render PersonalGuestCard and prefill RSVP from guest token"
```

---

## Task 24: Tabbed layout for `/confirmacoes/[token]` (Confirmações + Convidados)

**Files:**
- Modify: `app/confirmacoes/[token]/page.tsx`
- Create: `app/confirmacoes/[token]/GuestsTabClient.tsx`

- [ ] **Step 1: Create the `GuestsTabClient`**

`app/confirmacoes/[token]/GuestsTabClient.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import GuestListEditor from "@/components/admin/GuestListEditor";
import { DEFAULT_GUEST_MESSAGE_TEMPLATE } from "@/lib/guest-links";

interface GuestsTabClientProps {
  ownerToken: string;
  invitationSlug: string;
  messageTemplate: string;
}

export default function GuestsTabClient({
  ownerToken,
  invitationSlug,
  messageTemplate,
}: GuestsTabClientProps) {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <GuestListEditor
      apiBasePath={`/api/owner/${ownerToken}/guests`}
      invitationSlug={invitationSlug}
      invitationOrigin={origin}
      messageTemplate={messageTemplate || DEFAULT_GUEST_MESSAGE_TEMPLATE}
      title="Lista de convidados"
    />
  );
}
```

- [ ] **Step 2: Refactor `app/confirmacoes/[token]/page.tsx` for tabs**

Replace the file with:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  CheckCircle2,
  XCircle,
  Users,
  Heart,
  Calendar,
  MapPin,
} from "lucide-react";
import { ExportButton } from "./ExportButton";
import GuestsTabClient from "./GuestsTabClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ tab?: string }>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Tab navigation (server-rendered, link-based)
// ---------------------------------------------------------------------------

function TabNav({
  active,
  token,
  showGuests,
}: {
  active: "rsvps" | "guests";
  token: string;
  showGuests: boolean;
}) {
  return (
    <div className="border-b mb-6">
      <nav className="flex gap-6">
        <Link
          href={`/confirmacoes/${token}`}
          className={`pb-3 -mb-px text-sm font-medium border-b-2 transition-colors ${
            active === "rsvps"
              ? "border-stone-800 text-stone-800"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          Confirmações
        </Link>
        {showGuests && (
          <Link
            href={`/confirmacoes/${token}?tab=guests`}
            className={`pb-3 -mb-px text-sm font-medium border-b-2 transition-colors ${
              active === "guests"
                ? "border-stone-800 text-stone-800"
                : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            Convidados
          </Link>
        )}
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invitation RSVP view
// ---------------------------------------------------------------------------

async function InvitationRsvpView({
  token,
  tab,
}: {
  token: string;
  tab: "rsvps" | "guests";
}) {
  const invitation = await prisma.invitation.findUnique({
    where: { ownerToken: token },
    include: {
      rsvpResponses: { orderBy: { submittedAt: "desc" } },
    },
  });

  if (!invitation) return null;

  const couple = invitation.couple as { bride: string; groom: string };
  const date = invitation.date as { display: string };
  const location = invitation.location as { name: string; address?: string };

  const responses = invitation.rsvpResponses;
  const totalAttending = responses.filter((r) => r.attending).length;
  const totalDeclined = responses.filter((r) => !r.attending).length;
  const showGuests = invitation.guestManagementEnabled === true;
  const activeTab = showGuests && tab === "guests" ? "guests" : "rsvps";

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-rose-500">
              <Heart className="size-5 fill-rose-500" />
              <span className="text-sm font-medium uppercase tracking-widest">
                Brindel Studio
              </span>
            </div>
            {activeTab === "rsvps" && (
              <ExportButton
                token={token}
                filename={`confirmacoes-${invitation.slug}.pdf`}
              />
            )}
          </div>
          <h1 className="text-2xl font-semibold text-stone-800 mt-3">
            {couple.bride} &amp; {couple.groom}
          </h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-stone-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              {date.display}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {location.name}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <TabNav active={activeTab} token={token} showGuests={showGuests} />

        {activeTab === "rsvps" ? (
          <div className="space-y-6">
            <RsvpSummary
              total={responses.length}
              attending={totalAttending}
              declined={totalDeclined}
            />
            <RsvpList
              responses={responses.map((r) => ({
                id: r.id,
                guestName: r.guestName,
                email: r.email,
                attending: r.attending,
                dietaryRestrictions: r.dietaryRestrictions,
                message: r.message,
                submittedAt: r.submittedAt,
              }))}
              emptyLabel="Os convidados ainda não responderam ao convite."
            />
          </div>
        ) : (
          <GuestsTabClient
            ownerToken={token}
            invitationSlug={invitation.slug}
            messageTemplate={invitation.guestMessageTemplate ?? ""}
          />
        )}
      </main>

      <PageFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Save the Date RSVP view (unchanged — STD has no guest management)
// ---------------------------------------------------------------------------

async function SaveTheDateRsvpView({ token }: { token: string }) {
  const std = await prisma.saveTheDate.findUnique({
    where: { ownerToken: token },
    include: {
      rsvpResponses: { orderBy: { submittedAt: "desc" } },
    },
  });

  if (!std) return null;

  const couple = std.couple as { bride: string; groom: string };
  const date = std.date as { display: string };

  const responses = std.rsvpResponses;
  const totalAttending = responses.filter((r) => r.attending).length;
  const totalDeclined = responses.filter((r) => !r.attending).length;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-rose-500">
              <Heart className="size-5 fill-rose-500" />
              <span className="text-sm font-medium uppercase tracking-widest">
                Brindel Studio — Save the Date
              </span>
            </div>
            <ExportButton
              token={token}
              filename={`confirmacoes-std-${std.slug}.pdf`}
            />
          </div>
          <h1 className="text-2xl font-semibold text-stone-800 mt-3">
            {couple.bride} &amp; {couple.groom}
          </h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-stone-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              {date.display}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <RsvpSummary
          total={responses.length}
          attending={totalAttending}
          declined={totalDeclined}
        />
        <RsvpList
          responses={responses.map((r) => ({
            id: r.id,
            guestName: r.guestName,
            email: r.email,
            attending: r.attending,
            dietaryRestrictions: r.dietaryRestrictions,
            message: r.message,
            submittedAt: r.submittedAt,
          }))}
          emptyLabel="Os convidados ainda não responderam ao Save the Date."
        />
      </main>

      <PageFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared UI pieces (unchanged from the previous version)
// ---------------------------------------------------------------------------

function RsvpSummary({
  total,
  attending,
  declined,
}: {
  total: number;
  attending: number;
  declined: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="bg-white rounded-xl border p-4 text-center">
        <div className="text-3xl font-bold text-stone-800">{total}</div>
        <div className="text-xs text-stone-500 mt-1">Respostas</div>
      </div>
      <div className="bg-white rounded-xl border p-4 text-center">
        <div className="text-3xl font-bold text-emerald-600">{attending}</div>
        <div className="text-xs text-stone-500 mt-1">Confirmados</div>
      </div>
      <div className="bg-white rounded-xl border p-4 text-center">
        <div className="text-3xl font-bold text-rose-500">{declined}</div>
        <div className="text-xs text-stone-500 mt-1">Não vão</div>
      </div>
    </div>
  );
}

function RsvpList({
  responses,
  emptyLabel,
}: {
  responses: Array<{
    id: string;
    guestName: string;
    email: string | null;
    attending: boolean;
    dietaryRestrictions: string | null;
    message: string | null;
    submittedAt: Date;
  }>;
  emptyLabel: string;
}) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h2 className="font-semibold text-stone-800">Lista de Confirmações</h2>
        <p className="text-sm text-stone-500 mt-0.5">Actualizada em tempo real</p>
      </div>

      {responses.length === 0 ? (
        <div className="py-16 text-center text-stone-400">
          <Users className="size-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sem respostas ainda</p>
          <p className="text-sm mt-1">{emptyLabel}</p>
        </div>
      ) : (
        <ul className="divide-y">
          {responses.map((r) => (
            <li key={r.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-stone-800">
                      {r.guestName}
                    </span>
                    {r.attending ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="size-3" />
                        Confirma presença
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                        <XCircle className="size-3" />
                        Não vai comparecer
                      </span>
                    )}
                  </div>
                  {r.email && (
                    <p className="text-sm text-stone-400 mt-0.5">{r.email}</p>
                  )}
                  {r.dietaryRestrictions && (
                    <p className="text-sm text-amber-700 mt-1 bg-amber-50 px-2 py-1 rounded-md inline-block">
                      Restrições: {r.dietaryRestrictions}
                    </p>
                  )}
                  {r.message && (
                    <blockquote className="mt-2 pl-3 border-l-2 border-stone-200 text-sm italic text-stone-500">
                      &ldquo;{r.message}&rdquo;
                    </blockquote>
                  )}
                </div>
                <time className="text-xs text-stone-400 whitespace-nowrap shrink-0 mt-0.5">
                  {formatDate(r.submittedAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PageFooter() {
  return (
    <footer className="border-t mt-12 py-6 text-center text-xs text-stone-400">
      Brindel Studio &mdash; Convites Digitais para Casamentos
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Page — detects whether token belongs to invitation or save-the-date
// ---------------------------------------------------------------------------

export default async function OwnerRsvpPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "guests" ? "guests" : "rsvps";

  // Try invitation first (most common case)
  const invitation = await prisma.invitation.findUnique({
    where: { ownerToken: token },
  });

  if (invitation) {
    return <InvitationRsvpView token={token} tab={activeTab} />;
  }

  // Try save-the-date
  const std = await prisma.saveTheDate.findUnique({
    where: { ownerToken: token },
  });

  if (std) {
    return <SaveTheDateRsvpView token={token} />;
  }

  notFound();
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Lint**

Run: `npm run lint`

Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add app/confirmacoes/[token]/page.tsx app/confirmacoes/[token]/GuestsTabClient.tsx
git commit -m "feat(host): tabbed Confirmações + Convidados page at /confirmacoes/[token]"
```

---

## Task 25: End-to-end manual smoke test and final test run

**Files:** none (verification only)

- [ ] **Step 1: Run all unit tests via Vitest**

Run: `npm test`

Expected: Vitest reports 5 test files passing:
- `tests/envelope-cover-background.test.ts`
- `tests/save-the-date-envelope.test.ts`
- `tests/save-the-date-rsvp-button.test.ts`
- `tests/guest-links.test.ts`
- `tests/guests-slug.test.ts`

The summary line should read `Test Files  5 passed (5)` and `Tests  N passed (N)` with N matching the total `it(...)` blocks.

- [ ] **Step 2: Type-check the whole project**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Lint the whole project**

Run: `npm run lint`

Expected: passes (or only pre-existing warnings unrelated to the new code).

- [ ] **Step 4: Build the project**

Run: `npm run build`

Expected: builds successfully. The build runs `prisma generate && prisma migrate deploy` first, so any pending migration on the dev DB will apply.

- [ ] **Step 5: Manual end-to-end smoke test**

Start the dev server: `npm run dev`.

  1. **Admin enable:** Go to `/admin/invitations`, edit any invitation. Open the new "Gestão de Convidados" accordion. Toggle ON. Edit the message template if you want. Save.
  2. **Add a guest from admin:** In the same form, after saving once, the GuestListEditor should appear. Click "Adicionar convidado", fill in name "Maria Silva", companion "João", country code +258, phone "841234567", table "Mesa 7", canInviteOthers ON, note "Sem glúten". Save.
  3. **Host page:** Open `/confirmacoes/<the invitation's ownerToken>` in a new tab. Click the "Convidados" tab. Confirm Maria Silva is in the list with the badge "Pode convidar".
  4. **Per-row actions:**
     - Click the copy icon. Toast says "Link copiado!". Paste the URL into a new tab — verify it's `https://localhost:3000/<slug>?g=<token>&n=maria-silva`.
     - Click the WhatsApp icon. A new tab opens to `https://wa.me/258841234567?text=...` with the rendered message.
     - Click the SMS icon. The browser tries to open `sms:+258841234567?body=...`.
  5. **Personalized invite:** Open the copied personal URL. Verify:
     - The personal guest card appears between the hero section and the date card with "Olá, Maria Silva", "& João", "Mesa 7", "Sem glúten".
     - A "Convidar mais pessoas" button is visible (because canInviteOthers is on).
     - Click "Confirmar presença" (or open the RSVP modal). The Name field is pre-filled with "Maria Silva" and read-only.
  6. **RSVP linkage:** Submit an RSVP from the modal. Switch to the host page Confirmações tab — see the response listed. In Prisma Studio (`npm run db:studio`), open the `RsvpResponse` table and confirm the row has a non-null `guestId` matching Maria's id.
  7. **Self-registration:** Back on the personal invite, click "Convidar mais pessoas", fill name "Pedro Costa", submit. Verify the success state shows a personal URL. Open that URL in a new tab. Verify Pedro's personal card appears (no companion, no note, table empty), and there's NO "Convidar mais pessoas" button (because secondary guests can't invite further).
  8. **Generic invite still works:** Open `/<slug>` (no `?g=...`). Verify the personal guest card is NOT shown and the page renders exactly as before.
  9. **Disable the feature:** Go back to admin, toggle "Activar gestão de convidados" OFF, save. Reload the host page — the "Convidados" tab is gone. Reload Maria's personal URL — the personal card is gone but the page still works.
  10. **Re-enable** to confirm guests are preserved.

Stop the dev server.

- [ ] **Step 6: Final commit (no-op if nothing changed)**

If the manual test surfaced any tiny fixes, commit them. Otherwise, no-op.

```bash
git status
```

If clean, the implementation is complete.

---

## Notes for the implementer

- **Prisma client generation:** if you see TypeScript errors about missing `Guest` model, re-run `npx prisma generate`. The client is committed to `lib/generated/prisma` per `prisma/schema.prisma:3`.
- **Country code default:** `+258` (Mozambique) is the project default. Hosts can change per-guest via the dropdown.
- **The slugifier** is shared between `lib/guest-links.ts` (for URL `n` param) and `lib/guests.ts` (for the stored `slugifiedName`). Same function, no drift.
- **Theme variables in `<PersonalGuestCard>`:** the card uses `theme.cardBg`, `theme.cardBorder`, `theme.displayFont`, `theme.bodyFont`, `theme.uiFont`, `theme.accent`, `theme.ctaSecondaryBorder`, `theme.ctaSecondaryText`, `theme.ctaRadius`, `theme.textPrimary`, `theme.textSecondary`, `theme.textMuted` — all already defined on `TemplateTheme` in `lib/types.ts`.
- **Read-only RSVP name** uses native HTML `readOnly` attribute. The user can still see the value but can't edit. For accessibility, also keeping `aria-readonly="true"` is a nice-to-have but not strictly required.
- **`InviteOthersModal`** uses a hand-rolled overlay (matching the project's existing `RSVPModal` pattern) rather than the shadcn Dialog primitive — they share the same look-and-feel.
- **Tab navigation** in `/confirmacoes/[token]` uses plain `<Link>` + query params (server-rendered) rather than the shadcn `Tabs` primitive, because the server component can't drive a client-only tabs component without a client wrapper. This keeps the data-fetching server-side.
- **The admin GuestListEditor only renders after the invitation is saved** (`invitation?.id` is needed to construct the API path). New invitations show a hint to save first.
