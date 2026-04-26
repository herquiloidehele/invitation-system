# Admin Authentication Design

**Date:** 2026-04-26
**Status:** Approved
**Scope:** Single-admin username/password authentication for the admin panel

## Context

The Brindel Studio admin panel (`/admin/*`) and all admin API endpoints (`/api/admin/*`) are completely unprotected. Anyone with the URL can access full CRUD operations on invitations, themes, analytics, RSVPs, and save-the-dates. The admin sidebar displays a mock user ("Admin" / "admin@brindel.studio") with non-functional logout and settings buttons.

## Decision

Implement authentication using Next.js middleware with JWT tokens stored in HTTP-only cookies. Credentials are stored in environment variables. No database changes required.

## Architecture

### Credential Storage

Three new environment variables in `.env.development` and `.env.production`:

- `ADMIN_USERNAME` -- plaintext username (e.g., `admin`)
- `ADMIN_PASSWORD_HASH` -- bcrypt hash of the password (generated via `scripts/hash-password.ts`)
- `JWT_SECRET` -- random string (minimum 32 characters) for signing JWTs

The password is stored as a bcrypt hash rather than plaintext so the actual password is never visible in env files or server logs.

### Login Flow

1. User visits any `/admin/*` route.
2. `middleware.ts` checks for an `auth-token` cookie containing a valid JWT.
3. If missing or invalid, redirect to `/login`.
4. User enters username and password on the login page.
5. `POST /api/auth/login` validates username against `ADMIN_USERNAME` and verifies the password against `ADMIN_PASSWORD_HASH` using bcrypt.
6. On success, sets an HTTP-only, Secure, SameSite=Lax cookie containing a signed JWT (7-day expiry).
7. Redirects to `/admin`.

### Logout Flow

1. The "Sair" button in the admin sidebar calls `POST /api/auth/logout`.
2. That route clears the `auth-token` cookie.
3. Redirects to `/login`.

### Middleware

`middleware.ts` at the project root intercepts all requests matching:

- `/admin/:path*`
- `/api/admin/:path*`
- `/api/upload/presign`

Behavior:

- Uses `jose` to verify the JWT signature and expiration from the `auth-token` cookie.
- **Valid JWT:** request proceeds normally.
- **Invalid/missing JWT on page routes:** redirect to `/login`.
- **Invalid/missing JWT on API routes:** return `401 { error: "Unauthorized" }`.

bcrypt does not run in Edge Runtime, so password verification happens only in the `/api/auth/login` route handler (Node.js runtime). The middleware only verifies JWT signatures.

### Login Page

A centered card using existing shadcn/ui components (`Card`, `Input`, `Button`, `Label`) with:

- Username field
- Password field
- Login button
- Error message display on invalid credentials
- Client component (`"use client"`) with `react-hook-form` for form handling

No Brindel Studio branding beyond the page title. Clean and minimal.

## Protected Routes

**Automatically protected by middleware (no per-route changes):**

- All `/admin/*` pages (dashboard, invitations, templates, analytics, rsvps, save-the-dates, save-the-date-themes)
- All `/api/admin/*` API endpoints
- `/api/upload/presign`

**Unprotected (unchanged):**

- `/`, `/[slug]`, `/s/[slug]`, `/confirmar/[slug]`, `/confirmacoes/[token]`
- `/api/rsvp`, `/api/events`, `/api/save-the-date/*`, `/api/export/rsvps/[token]`

## New Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Root middleware -- JWT verification, route protection |
| `app/login/page.tsx` | Login page -- centered form with shadcn/ui components (outside `/admin` to avoid sidebar layout) |
| `app/api/auth/login/route.ts` | POST -- validate credentials, set JWT cookie |
| `app/api/auth/logout/route.ts` | POST -- clear cookie, redirect |
| `lib/auth.ts` | Shared auth constants and JWT helper functions |
| `scripts/hash-password.ts` | One-time CLI utility to generate bcrypt password hash |

## Modified Files

| File | Change |
|------|--------|
| `components/admin/app-sidebar.tsx` | Wire "Sair" button to call logout API; remove hardcoded mock user |
| `.env.development` | Add `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET` |
| `.env.production` | Add `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET` |
| `package.json` | Add `jose`, `bcrypt`, `@types/bcrypt` |

## Dependencies

- `jose` (~3KB) -- JWT signing/verification, Edge Runtime compatible
- `bcrypt` + `@types/bcrypt` -- password hashing in Node.js runtime

## Security Considerations

- **HTTP-only cookie** prevents JavaScript access (XSS protection).
- **Secure flag** ensures cookie is only sent over HTTPS (in production).
- **SameSite=Lax** provides baseline CSRF protection.
- **bcrypt hash** in env var means plaintext password is never stored.
- **JWT expiry** (7 days) limits the window of a stolen token.
- **JWT revocation:** For a single admin, changing `JWT_SECRET` invalidates all tokens immediately. No need for a token blacklist.

## What This Does NOT Include

- No user registration or invite flow.
- No password reset flow (change the env var directly).
- No multi-user support.
- No role-based access control.
- No OAuth/social login.
- No rate limiting on login attempts (can be added later if needed).
