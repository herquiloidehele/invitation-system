# Guest Management Design

**Date:** 2026-04-27
**Status:** Approved
**Scope:** Allow hosts (couples) to pre-register guests, generate per-guest invite links, share them via WhatsApp/SMS, and personalize the public invitation per guest. Admin-gated, off by default.

---

## Context

Today, RSVPs are open: any visitor to `/<slug>` types a name and submits. Hosts have no way to pre-build a guest list, no per-guest links, no table assignments, and no way to share invitations with one click via WhatsApp/SMS. The host-facing page at `/confirmacoes/[token]` only shows the read-only RSVP list.

This feature adds guest pre-registration, personalized invite links, table assignments, sharing helpers, and a host-side guest list editor. It is feature-flagged per invitation — the existing flow remains unchanged when the toggle is off.

---

## Decision

Add a relational `Guest` model with a unique public `token`, a `guestManagementEnabled` toggle on `Invitation`, and a nullable `guestId` FK on `RsvpResponse`. Hosts manage guests on the existing `/confirmacoes/[token]` page (now tabbed: "Confirmações" + "Convidados"). Admins enable the feature and may manage guests from the admin invitation form. Public invitation URLs gain an optional `?g=<token>` parameter that triggers a personalized greeting card and prefills the RSVP modal.

---

## Architecture

### Data Model

Three Prisma changes:

**1. New model `Guest`** (`prisma/schema.prisma`):

```prisma
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

  invitedById     String?
  invitedBy       Guest?  @relation("GuestInvitations", fields: [invitedById], references: [id], onDelete: SetNull)
  invitedGuests   Guest[] @relation("GuestInvitations")

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  rsvpResponses   RsvpResponse[]

  @@index([invitationSlug])
  @@index([token])
}
```

**2. Two new fields on `Invitation`:**

```prisma
guestManagementEnabled Boolean @default(false)
guestMessageTemplate   String?
```

**3. One new field on `RsvpResponse`:**

```prisma
guestId String?
guest   Guest?  @relation(fields: [guestId], references: [id], onDelete: SetNull)
@@index([guestId])
```

Notes:
- `slugifiedName` is stored (not derived) so it remains stable when `name` changes; the slugifier is shared with `lib/guests.ts` and matches the existing slug helper in `app/admin/invitations/InvitationForm.tsx`.
- `phoneCountryCode + phoneNumber` are stored separately; full E.164 is composed at use time. WhatsApp's `wa.me` accepts no `+`; SMS's `sms:` keeps it.
- `invitedById` cascades to `SetNull` on delete — secondary guests survive a primary guest's removal so the host can review them.
- Guest deletion does not cascade to RSVP responses; instead `RsvpResponse.guestId` becomes null and the historical `guestName` is preserved.

### Routing

**Public (no auth):**

| Route | Purpose |
|---|---|
| `/<slug>` | Existing invitation page. Modified: reads `?g=<token>` server-side. Validates the guest belongs to this invitation. Personal card and prefilled RSVP appear when valid. |
| `/<slug>?g=<token>&n=<slugified-name>` | Personalized invitation. `g` is the source of truth. `n` is cosmetic for shareability and is ignored on the server. |

**Owner-token (no auth, scoped by token in path):**

| Route | Purpose |
|---|---|
| `/confirmacoes/[token]` | Tabbed: "Confirmações" (existing) and "Convidados" (new, only when `guestManagementEnabled`). Tab via `?tab=guests`. |
| `GET/POST /api/owner/[token]/guests` | List / create guests. |
| `PATCH/DELETE /api/owner/[token]/guests/[guestId]` | Update / delete guest. |

**Admin (JWT-protected by existing middleware):**

| Route | Purpose |
|---|---|
| `/admin/invitations/[id]/edit` | Modified: new accordion section "Gestão de Convidados" with toggle, message template, and `<GuestListEditor>`. |
| `GET/POST /api/admin/invitations/[id]/guests` | Admin equivalent of owner endpoints. |
| `PATCH/DELETE /api/admin/invitations/[id]/guests/[guestId]` | Admin equivalent of owner endpoints. |

**Public guest helpers (no auth):**

| Route | Purpose |
|---|---|
| `GET /api/guests/by-token/[token]` | Returns minimal guest info: `name`, `companion`, `tableLabel`, `note`, `canInviteOthers`, `invitationSlug`. No phone. |
| `POST /api/guests/self-register` | Body `{ inviterToken, name, companion? }`. Creates a new guest with `invitedById` set; allowed only when the inviter has `canInviteOthers === true`. New guests are forced `canInviteOthers = false`. Returns the new guest's token + personal URL. |

**Modified existing route:**

- `POST /api/rsvp` now accepts an optional `guestToken`. If present, it must belong to `invitationSlug`; the resulting `RsvpResponse.guestId` is set.

### Components

**New:**
- `components/admin/GuestListEditor.tsx` — reusable guest list with search, add, edit, delete, and per-row action icons. Used by host page and admin form.
- `components/admin/GuestForm.tsx` — Add/Edit form rendered inside a sheet/dialog.
- `components/admin/GuestRowActions.tsx` — copy / WhatsApp / SMS / edit / delete icons.
- `components/shared/PersonalGuestCard.tsx` — public card shown on `/<slug>` when `?g=<token>` is valid.
- `components/shared/InviteOthersModal.tsx` — "Convidar mais pessoas" modal triggered from `PersonalGuestCard`.

**Modified:**
- `app/[slug]/page.tsx` — read `g` searchParam, fetch guest, pass to view.
- `app/[slug]/InvitationView.tsx` — accept and forward the optional `guest`.
- `components/shared/InvitationPage.tsx` — accept `guest` prop; render `<PersonalGuestCard>` between hero and date card if present; pass `guest` through to the RSVP modal.
- `components/shared/RSVPModal.tsx` — when `guest` prop is present, prefill name (read-only), allow a "+1" toggle when companion is set, include `guestToken` in submission.
- `app/confirmacoes/[token]/page.tsx` — wrap in tabs; show "Convidados" tab only when `guestManagementEnabled`.
- `app/confirmacoes/[token]/GuestsTabClient.tsx` — new client component that mounts `<GuestListEditor>` configured for the owner-token API.
- `app/admin/invitations/InvitationForm.tsx` — add accordion section with toggle, message template, and `<GuestListEditor>`.
- `app/api/rsvp/route.ts` — accept and validate `guestToken`; link RSVP.
- `lib/types.ts` — add `Guest` type; extend `InvitationData` with `guestManagementEnabled`, `guestMessageTemplate`, and an optional `guest` (the current personal guest viewing the invite).
- `lib/invitations.ts` — include the new fields.
- `app/api/admin/invitations/route.ts` and `app/api/admin/invitations/[id]/route.ts` — include the two new fields in payloads.

**New libs:**
- `lib/guests.ts` — server-side data access. Exports `getGuestByToken`, `getGuestsForInvitation`, `createGuest`, `updateGuest`, `deleteGuest`, `selfRegisterGuest`, the slugifier, and `GuestData` types. Single source of truth for business rules (e.g., self-registered guests cannot themselves invite others).
- `lib/guest-links.ts` — pure utilities. Exports `buildPersonalInviteUrl`, `buildWhatsAppUrl`, `buildSmsUrl`, `renderMessageTemplate`, `COUNTRY_CODES`. No React, no Next.js, no Prisma — fully unit-testable.

### Data flow

**Personalized invitation render:**
1. User opens `/<slug>?g=<token>`.
2. `app/[slug]/page.tsx` (server component) calls `getInvitation(slug)` and `getGuestByToken(token)`.
3. If guest exists and `guest.invitationSlug === slug` and `invitation.guestManagementEnabled`, the `guest` is forwarded; otherwise, it's omitted (silent fallback).
4. `InvitationView` → `InvitationPage` mounts `<PersonalGuestCard>` between hero and date card.
5. RSVP modal receives the `guest` prop and prefills.

**Host adds a guest:**
1. Host opens `/confirmacoes/[token]?tab=guests`.
2. `<GuestListEditor>` (via `GuestsTabClient`) fetches `GET /api/owner/[token]/guests`.
3. Host clicks "Adicionar convidado" → sheet opens with `<GuestForm>`.
4. Submit posts to `POST /api/owner/[token]/guests`.
5. The route delegates to `lib/guests.ts → createGuest` which validates, slugifies, persists, and returns the new guest.
6. The list re-fetches.

**Host shares via WhatsApp:**
1. Each row exposes a WhatsApp icon.
2. Click computes `buildWhatsAppUrl({ countryCode, number, message })` where `message = renderMessageTemplate(invitation.guestMessageTemplate, { name, link })` and `link = buildPersonalInviteUrl({ origin, slug, token, name })`.
3. The browser opens `https://wa.me/<digits>?text=<encoded>` in a new tab.

**Secondary guest self-registers:**
1. Maria has `canInviteOthers = true` and visits `/<slug>?g=<mariaToken>`.
2. She clicks "Convidar mais pessoas" → modal with name + companion.
3. POST to `/api/guests/self-register` with `inviterToken=mariaToken`.
4. Server validates that Maria has `canInviteOthers` and that the invitation has `guestManagementEnabled`.
5. New guest record is created with `invitedById = maria.id`, `canInviteOthers = false`, no phone (host adds later if needed).
6. Response includes the new guest's personal URL; Maria copies it and shares.

### Authorization model

- `/api/admin/*`: existing JWT middleware.
- `/api/owner/[token]/*`: route handler validates `token` by fetching the invitation; 404 on miss. Per-guest endpoints additionally verify the guest's `invitationSlug` matches the token's invitation.
- `/api/guests/by-token/[token]`: public, returns only non-sensitive fields (no phone, no invitedById).
- `/api/guests/self-register`: public, validates inviter token + flags before creating.

### UX details

**Public personal card** (between hero and date card):
- Eyebrow: "— CONVITE PESSOAL —" in script/body font.
- Headline: "Olá, {Name}" in display font.
- Optional: "& {Companion}" in body font.
- Two info pills: "Mesa" (always) and "Nota" (only when present).
- Optional CTA: "Convidar mais pessoas" if `canInviteOthers`.
- Theme-aware: uses `theme.cardBg`, `theme.cardBorder`, fonts and accent.

**Host "Convidados" tab:**
- Header with total count and search.
- Table on desktop, stacked cards on mobile.
- Per-row icons: copy link, WhatsApp, SMS, edit, delete.
- Empty state with "Adicionar primeiro convidado" CTA.
- Add/Edit form fields: Nome, Acompanhante, Indicativo (default `+258`), Telefone, Mesa, Pode convidar mais pessoas (toggle), Nota.

**Admin form section:**
- New accordion item: "Gestão de Convidados".
- Toggle `guestManagementEnabled`.
- When ON: textarea `guestMessageTemplate` with helper text explaining `{name}` / `{link}` placeholders, plus `<GuestListEditor>` for inline management.
- Default template: `"Olá {name}, estás convidado(a) para o nosso casamento de {bride} & {groom}. Confirma a tua presença aqui: {link}"`.

### Country codes

A static list in `lib/guest-links.ts`, ordered: Mozambique (+258) — default — then Portugal (+351), Brazil (+55), USA (+1), United Kingdom (+44), Spain (+34), South Africa (+27).

---

## Error Handling

| Scenario | Response |
|---|---|
| `?g=<token>` token does not exist | Silent fallback: render `/<slug>` without `<PersonalGuestCard>`. |
| `?g=<token>` belongs to another invitation | Silent fallback (compare `guest.invitationSlug` to `slug`). |
| Owner-token API: bad token | `404 { error: "Invitation not found" }` (do not reveal token validity). |
| Owner-token API: guest belongs to a different invitation | `403 { error: "Forbidden" }`. |
| Self-register: inviter `canInviteOthers === false` | `403 { error: "Inviter cannot invite others" }`. |
| Self-register: invitation has `guestManagementEnabled === false` | `403 { error: "Guest management is disabled" }`. |
| Self-register: missing/invalid `name` | `400` with field errors (zod). |
| Phone validation | Digits + spaces only, length 6–15 after stripping spaces. Country code from dropdown. |
| Duplicate guest name in same invitation | Allowed; UI shows soft warning. |
| Delete guest with RSVP | Allowed; `RsvpResponse.guestId` becomes null, `guestName` preserved. UI confirmation warns. |
| Delete primary inviter | `invitedById` of secondary guests becomes null. UI confirmation warns. |
| Toggling `guestManagementEnabled` OFF with guests existing | Allowed; data preserved; UI hides guest features and personal URLs no longer trigger personalization. UI confirmation warns. |
| RSVP with mismatched `guestToken` | `400 { error: "Guest does not belong to this invitation" }`. |
| Concurrent host edits | Last-write-wins (single-couple workflow; not worth optimistic-lock complexity). |

---

## Testing

Project uses standalone `tests/*.test.ts` files run with `npx tsx`. The new tests follow the same pattern.

**`tests/guest-links.test.ts`:**
- `buildPersonalInviteUrl` — encodes accents, includes both `g` and `n` params, handles trailing slashes in origin.
- `buildWhatsAppUrl` — strips `+`, joins country code with number, URL-encodes the message body, handles empty message.
- `buildSmsUrl` — keeps `+`, formats per `sms:` URI scheme, encodes message.
- `renderMessageTemplate` — substitutes `{name}` and `{link}` (multiple occurrences), ignores unknown placeholders, leaves the template unchanged when no placeholders.

**`tests/guests-slug.test.ts`:**
- Slugifies "José" → "jose", "Conceição da Silva" → "conceicao-da-silva".
- Trims whitespace, collapses `-+` to single `-`, strips leading/trailing `-`.
- Lowercases ASCII output.

A new `npm test` script runs all `tests/*.test.ts`, bailing on the first failure. No new test framework or DB harness is introduced.

Manual QA (post-implementation) covers:
- Admin enable + disable cycle preserves data.
- Host adds, edits, deletes guests; copy / WhatsApp / SMS links open correctly with the rendered message.
- Personal invite link shows the personal card and prefills RSVP.
- Stale or wrong-invitation token falls back silently.
- Self-registration: a primary guest's secondary invitee can RSVP via the new link.

---

## Out of Scope

- Host login / per-host accounts (still token-based).
- CSV bulk import of guests.
- Per-guest analytics events.
- Guest groups beyond `tableLabel`.
- Auto-sending of WhatsApp / SMS (only deep links generated).
- Guest-side RSVP edits or check-ins.
- Multi-language UI (Portuguese only).
- Save-the-Date guest management (this iteration is `Invitation`-only).

---

## Migration

Single Prisma migration `add_guest_management`:
- Creates `Guest` table with all fields and indexes.
- Adds `guestManagementEnabled BOOLEAN NOT NULL DEFAULT false` to `Invitation`.
- Adds `guestMessageTemplate TEXT` to `Invitation`.
- Adds `guestId TEXT` and FK to `RsvpResponse` with `ON DELETE SET NULL`.
- Adds index on `RsvpResponse(guestId)`.

Backwards compatible — all new columns are nullable or have defaults; existing rows are unaffected.
