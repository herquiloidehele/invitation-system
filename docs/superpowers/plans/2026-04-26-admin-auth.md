# Admin Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Protect the admin panel and admin API routes behind username/password authentication using JWT tokens in HTTP-only cookies.

**Architecture:** Next.js middleware at the project root intercepts `/admin/*` and `/api/admin/*` requests, verifying a JWT from an HTTP-only cookie using `jose`. Login credentials are validated against environment variables (username + bcrypt-hashed password). No database changes.

**Tech Stack:** `jose` (Edge-compatible JWT), `bcrypt` + `@types/bcrypt` (password hashing), Next.js middleware, shadcn/ui components.

---

## File Structure

| File | Responsibility |
|------|---------------|
| `lib/auth.ts` | Auth constants (cookie name, JWT expiry) and JWT sign/verify helpers using `jose` |
| `middleware.ts` | Route protection — verify JWT cookie on `/admin/*` and `/api/admin/*` requests |
| `app/login/page.tsx` | Login page — centered card form with username/password fields (outside `/admin` to avoid sidebar layout) |
| `app/api/auth/login/route.ts` | POST endpoint — validate credentials with bcrypt, set JWT cookie |
| `app/api/auth/logout/route.ts` | POST endpoint — clear JWT cookie |
| `scripts/hash-password.ts` | CLI utility to generate bcrypt hashes for the env var |
| `components/admin/app-sidebar.tsx` | Modified — wire "Sair" button to logout API |
| `.env.development` | Modified — add `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET` |
| `package.json` | Modified — add `jose`, `bcrypt`, `@types/bcrypt` dependencies |

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install jose, bcrypt, and @types/bcrypt**

```bash
npm install jose bcrypt
npm install --save-dev @types/bcrypt
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('jose'); require('bcrypt'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add jose and bcrypt for admin auth"
```

---

### Task 2: Create the password hashing script and set environment variables

**Files:**
- Create: `scripts/hash-password.ts`
- Modify: `.env.development`

- [ ] **Step 1: Create `scripts/hash-password.ts`**

```typescript
import bcrypt from "bcrypt";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npx tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log("\nGenerated bcrypt hash:\n");
console.log(hash);
console.log("\nAdd this to your .env file as ADMIN_PASSWORD_HASH\n");
```

- [ ] **Step 2: Run the script to generate a hash for a dev password**

```bash
npx tsx scripts/hash-password.ts admin123
```

Expected: outputs a bcrypt hash string starting with `$2b$12$...`

- [ ] **Step 3: Add env vars to `.env.development`**

Append the following to the end of `.env.development` (replace the hash with the one generated in step 2):

```
# Admin Authentication
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="<paste hash from step 2>"
JWT_SECRET="dev-jwt-secret-change-in-production-min-32-chars"
```

- [ ] **Step 4: Verify env vars load**

```bash
npx tsx --env-file=.env.development -e "console.log(process.env.ADMIN_USERNAME, process.env.JWT_SECRET ? 'JWT_SECRET set' : 'MISSING')"
```

Expected: `admin JWT_SECRET set`

- [ ] **Step 5: Commit**

```bash
git add scripts/hash-password.ts
git commit -m "feat: add password hashing script and auth env vars"
```

Note: `.env.development` is gitignored, so it won't be committed.

---

### Task 3: Create `lib/auth.ts` — auth constants and JWT helpers

**Files:**
- Create: `lib/auth.ts`

- [ ] **Step 1: Create `lib/auth.ts`**

```typescript
import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = "auth-token";
export const JWT_EXPIRY = "7d";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signJwt(payload: { username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyJwt(
  token: string
): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as { username: string };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Verify the file compiles**

```bash
npx tsc --noEmit lib/auth.ts --moduleResolution bundler --module esnext --target ES2017 --esModuleInterop --skipLibCheck 2>&1 || echo "Check errors above"
```

Expected: no errors (or only errors from missing next-env types, which is fine).

- [ ] **Step 3: Commit**

```bash
git add lib/auth.ts
git commit -m "feat: add JWT sign/verify helpers for admin auth"
```

---

### Task 4: Create `POST /api/auth/login` route

**Files:**
- Create: `app/api/auth/login/route.ts`

- [ ] **Step 1: Create `app/api/auth/login/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { signJwt, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Nome de utilizador e palavra-passe são obrigatórios" },
        { status: 400 }
      );
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminUsername || !adminPasswordHash) {
      console.error("Admin credentials not configured in environment variables");
      return NextResponse.json(
        { error: "Erro de configuração do servidor" },
        { status: 500 }
      );
    }

    if (username !== adminUsername) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, adminPasswordHash);

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const token = await signJwt({ username });

    const response = NextResponse.json({ success: true });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/login/route.ts
git commit -m "feat: add login API route with bcrypt verification"
```

---

### Task 5: Create `POST /api/auth/logout` route

**Files:**
- Create: `app/api/auth/logout/route.ts`

- [ ] **Step 1: Create `app/api/auth/logout/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/logout/route.ts
git commit -m "feat: add logout API route to clear auth cookie"
```

---

### Task 6: Create `middleware.ts` — route protection

**Files:**
- Create: `middleware.ts` (project root)

- [ ] **Step 1: Create `middleware.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyJwt, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const payload = token ? await verifyJwt(token) : null;

  if (!payload) {
    const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/upload/presign",
  ],
};
```

Note: The login page lives at `/login` (outside `/admin`), so the matcher `/admin/:path*` protects all admin pages without needing a negative lookahead. The `/login` route is unmatched and accessible without auth.

- [ ] **Step 2: Verify the middleware file is at the project root**

```bash
ls -la middleware.ts
```

Expected: file exists at project root alongside `next.config.ts`.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add auth middleware protecting admin routes"
```

---

### Task 7: Create the login page

**Files:**
- Create: `app/login/page.tsx`

The login page lives at `/login` (outside the `/admin` directory) to avoid inheriting the admin sidebar layout from `app/admin/layout.tsx`. In Next.js, nested layouts stack — they cannot be overridden — so placing the login page outside `/admin` is the simplest way to get a standalone page.

- [ ] **Step 1: Create `app/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GalleryVerticalEnd } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao iniciar sessão");
        return;
      }

      const from = searchParams.get("from") || "/admin";
      router.push(from);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">Brindel Studio</CardTitle>
          <CardDescription>
            Introduza as suas credenciais para aceder ao painel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Utilizador</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Palavra-passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A entrar..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

```bash
npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login
```

Expected: `200`

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin
```

Expected: `307` (redirect to `/login`)

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: add login page with shadcn/ui form"
```

---

### Task 8: Wire up the sidebar logout button

**Files:**
- Modify: `components/admin/app-sidebar.tsx:203-244`

- [ ] **Step 1: Update the sidebar to add logout functionality**

In `components/admin/app-sidebar.tsx`, replace the `SidebarFooter` section (lines 203-244) with a version that calls the logout API:

Replace:
```tsx
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  />
                }
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="/images/avatar.png" alt="Admin" />
                  <AvatarFallback className="rounded-lg">BS</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Admin</span>
                  <span className="truncate text-xs">admin@brindel.studio</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <Settings className="mr-2 size-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
```

With:
```tsx
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  />
                }
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="/images/avatar.png" alt="Admin" />
                  <AvatarFallback className="rounded-lg">BS</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Admin</span>
                  <span className="truncate text-xs">admin@brindel.studio</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem
                  onSelect={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
```

Changes:
1. Removed the non-functional "Configuracoes" menu item and its separator.
2. Added `onSelect` handler to "Sair" that calls `POST /api/auth/logout` and redirects to `/login`.

- [ ] **Step 2: Remove unused imports**

In the imports section, remove `Settings` from the lucide-react import (line 22) and remove `DropdownMenuSeparator` from the dropdown-menu import (line 52) since both are no longer used.

- [ ] **Step 3: Verify the app still compiles**

```bash
npx next build 2>&1 | tail -5
```

Expected: build succeeds without errors.

- [ ] **Step 4: Commit**

```bash
git add components/admin/app-sidebar.tsx
git commit -m "feat: wire sidebar logout button to auth API"
```

---

### Task 9: Add `bcrypt` to `serverExternalPackages` in Next.js config

**Files:**
- Modify: `next.config.ts`

`bcrypt` uses native bindings and must be excluded from Next.js bundling.

- [ ] **Step 1: Update `next.config.ts`**

In `next.config.ts`, add `"bcrypt"` to the `serverExternalPackages` array:

Replace:
```typescript
  serverExternalPackages: ["pg"],
```

With:
```typescript
  serverExternalPackages: ["pg", "bcrypt"],
```

- [ ] **Step 2: Commit**

```bash
git add next.config.ts
git commit -m "chore: add bcrypt to serverExternalPackages"
```

---

### Task 10: End-to-end manual verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify unauthenticated access is blocked**

Visit `http://localhost:3000/admin` in the browser.
Expected: redirected to `/login?from=/admin`.

- [ ] **Step 3: Verify login page renders**

At `/login`, confirm:
- Centered card with Brindel Studio icon
- Username and password fields
- "Entrar" button

- [ ] **Step 4: Verify invalid login shows error**

Enter wrong credentials (e.g., `admin` / `wrong`).
Expected: "Credenciais invalidas" error message shown.

- [ ] **Step 5: Verify successful login**

Enter correct credentials (`admin` / `admin123`).
Expected: redirected to `/admin` dashboard. Sidebar and all admin pages accessible.

- [ ] **Step 6: Verify API protection**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/admin/invitations
```

Expected: `401`

- [ ] **Step 7: Verify logout**

Click "Sair" in the sidebar.
Expected: redirected to `/login`. Visiting `/admin` again redirects to `/login`.

- [ ] **Step 8: Verify public routes are unaffected**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```

Expected: `200`

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "feat: complete admin authentication implementation"
```
