# Custom Invitation Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a localized minimal CTA strip after the landing Gallery that advertises a fixed EUR 250 custom-invitation service, converts the price to the selected currency, and opens a prefilled WhatsApp conversation.

**Architecture:** Keep currency derivation and formatting in a pure client-safe helper, then render a focused client component using existing landing tokens, animation, translations, and WhatsApp URL construction. Insert the component between `GallerySection` and `ProcessSection`; no database, API, or admin changes are needed.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, Tailwind CSS v4, Framer Motion through `AnimatedSection`, Vitest.

## Global Constraints

- The section renders directly between `GallerySection` and `ProcessSection`.
- The EUR base price is exactly `25_000` cents and is displayed as a fixed price, never with the `Desde` prefix.
- Convert EUR into the selected `EUR`, `MZN`, `AOA`, `BRL`, or `USD` currency with the existing `deriveCents` rates and rounding.
- The minimum production time is one month.
- The CTA opens the configured Brindeal WhatsApp number in a new tab with a localized prefilled message.
- Add natural Portuguese, English, and Spanish copy under one `LandingCustomInvitation` namespace.
- Reuse existing landing tokens, Outfit typography, `AnimatedSection`, and `WhatsAppIcon`; add no dependencies.
- Respect keyboard focus, colour contrast, and the existing reduced-motion behaviour.
- Do not add database, Prisma, API, admin, navigation, analytics, form, or modal changes.
- Use `npm run build`; never invoke `next build` directly.

---

## File Structure

- Create `lib/custom-invitation.ts` — owns the EUR base price and returns a correctly converted and formatted fixed-price label.
- Create `tests/custom-invitation.test.ts` — unit coverage for the fixed EUR price, non-EUR conversion, and absence of `Desde`.
- Create `components/landing/CustomInvitationSection.tsx` — owns presentation, translations, price display, and WhatsApp CTA.
- Create `tests/custom-invitation-section.test.ts` — server-render coverage for the section's copy, fixed price, and WhatsApp link without requiring a DOM environment.
- Modify `components/landing/BrindealHomepage.tsx` — places the new section after the Gallery and passes `currentCurrency`.
- Modify `messages/pt.json` — approved Portuguese content.
- Modify `messages/en.json` — natural English equivalent.
- Modify `messages/es.json` — natural Spanish equivalent.
- Modify `tests/landing-whatsapp.test.ts` — verifies the localized Portuguese enquiry message is encoded into the existing WhatsApp URL.
- Reuse `tests/messages-parity.test.ts` unchanged to prove the three translation files retain the same key structure.

---

### Task 1: Fixed Custom-Invitation Price Helper

**Files:**

- Create: `tests/custom-invitation.test.ts`
- Create: `lib/custom-invitation.ts`

**Interfaces:**

- Consumes: `deriveCents(baseEurCents: number, target: Currency): number`, `CURRENCY_LOCALE`, and `formatCurrencyAmount(cents: number, currency: string, locale: string): string`.
- Produces: `CUSTOM_INVITATION_PRICE_EUR_CENTS: 25000` and `getCustomInvitationPrice(currency: Currency): string`.

- [ ] **Step 1: Write the failing pricing tests**

Create `tests/custom-invitation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  CUSTOM_INVITATION_PRICE_EUR_CENTS,
  getCustomInvitationPrice,
} from "@/lib/custom-invitation";

describe("custom invitation price", () => {
  it("keeps the fixed EUR 250 base price", () => {
    expect(CUSTOM_INVITATION_PRICE_EUR_CENTS).toBe(25_000);
    expect(getCustomInvitationPrice("EUR")).toBe("250 €");
  });

  it("converts and cleanly formats a non-EUR currency", () => {
    expect(getCustomInvitationPrice("MZN")).toBe("17 500 MZN");
  });

  it("does not present the fixed price as a starting price", () => {
    expect(getCustomInvitationPrice("EUR")).not.toContain("Desde");
    expect(getCustomInvitationPrice("MZN")).not.toContain("Desde");
  });
});
```

- [ ] **Step 2: Run the test and verify the expected red state**

Run:

```bash
npx vitest run tests/custom-invitation.test.ts
```

Expected: FAIL because `@/lib/custom-invitation` does not exist.

- [ ] **Step 3: Implement the minimal price helper**

Create `lib/custom-invitation.ts`:

```ts
import {
  CURRENCY_LOCALE,
  deriveCents,
  type Currency,
} from "@/lib/currency/config";
import { formatCurrencyAmount } from "@/lib/landing-price";

export const CUSTOM_INVITATION_PRICE_EUR_CENTS = 25_000;

export function getCustomInvitationPrice(currency: Currency): string {
  const convertedCents = deriveCents(
    CUSTOM_INVITATION_PRICE_EUR_CENTS,
    currency,
  );

  return formatCurrencyAmount(
    convertedCents,
    currency,
    CURRENCY_LOCALE[currency],
  );
}
```

- [ ] **Step 4: Run the focused test and verify green**

Run:

```bash
npx vitest run tests/custom-invitation.test.ts
```

Expected: PASS, 3 tests passed.

- [ ] **Step 5: Run related currency and price regression tests**

Run:

```bash
npx vitest run tests/custom-invitation.test.ts tests/currency.test.ts tests/landing-price.test.ts
```

Expected: PASS with no failed tests.

- [ ] **Step 6: Commit the pricing unit**

```bash
git add lib/custom-invitation.ts tests/custom-invitation.test.ts
git commit -m "feat: add custom invitation price helper"
```

---

### Task 2: Localized Section Copy and WhatsApp Message

**Files:**

- Modify: `tests/landing-whatsapp.test.ts`
- Modify: `messages/pt.json`
- Modify: `messages/en.json`
- Modify: `messages/es.json`
- Verify unchanged: `tests/messages-parity.test.ts`

**Interfaces:**

- Consumes: `buildWhatsappUrl(message?: string): string`.
- Produces translation keys `LandingCustomInvitation.eyebrow`, `title`, `body`, `priceLabel`, `timelineValue`, `timelineLabel`, `cta`, `ctaNote`, `ctaAria`, and `whatsappMessage`.

- [ ] **Step 1: Write the failing localized WhatsApp test**

Replace the imports at the top of `tests/landing-whatsapp.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import pt from "../messages/pt.json";
import { buildPurchaseMessage, buildWhatsappUrl } from "@/lib/landing-whatsapp";
```

Add this test inside the existing `describe("landing WhatsApp helpers", ...)` block:

```ts
  it("encodes the localized custom-invitation enquiry", () => {
    expect(
      buildWhatsappUrl(pt.LandingCustomInvitation.whatsappMessage),
    ).toBe(
      "https://wa.me/351910671757?text=Ol%C3%A1!%20Gostaria%20de%20criar%20um%20convite%20100%25%20personalizado.",
    );
  });
```

- [ ] **Step 2: Run the test and verify the expected red state**

Run:

```bash
npx vitest run tests/landing-whatsapp.test.ts
```

Expected: FAIL because `LandingCustomInvitation` is not defined in `messages/pt.json`.

- [ ] **Step 3: Add the approved Portuguese translations**

Insert this top-level namespace between `LandingGallery` and `LandingProcess` in `messages/pt.json`:

```json
  "LandingCustomInvitation": {
    "eyebrow": "Uma alternativa só sua",
    "title": "Ainda não encontrou o convite certo?",
    "body": "Criamos consigo um convite totalmente original, pensado de raiz para refletir o estilo do seu evento.",
    "priceLabel": "preço do projeto",
    "timelineValue": "1 mês",
    "timelineLabel": "prazo mínimo",
    "cta": "Criar o meu convite",
    "ctaNote": "Abre no WhatsApp",
    "ctaAria": "Criar um convite personalizado pelo WhatsApp",
    "whatsappMessage": "Olá! Gostaria de criar um convite 100% personalizado."
  },
```

- [ ] **Step 4: Add the natural English translations**

Insert the same namespace and keys between `LandingGallery` and `LandingProcess` in `messages/en.json`:

```json
  "LandingCustomInvitation": {
    "eyebrow": "Made just for you",
    "title": "Still haven't found the right invitation?",
    "body": "We create a completely original invitation with you, designed from scratch to reflect the style of your event.",
    "priceLabel": "project price",
    "timelineValue": "1 month",
    "timelineLabel": "minimum lead time",
    "cta": "Create my invitation",
    "ctaNote": "Opens in WhatsApp",
    "ctaAria": "Create a custom invitation on WhatsApp",
    "whatsappMessage": "Hello! I'd like to create a 100% custom invitation."
  },
```

- [ ] **Step 5: Add the natural Spanish translations**

Insert the same namespace and keys between `LandingGallery` and `LandingProcess` in `messages/es.json`:

```json
  "LandingCustomInvitation": {
    "eyebrow": "Una alternativa solo para ti",
    "title": "¿Aún no has encontrado la invitación ideal?",
    "body": "Creamos contigo una invitación totalmente original, diseñada desde cero para reflejar el estilo de tu evento.",
    "priceLabel": "precio del proyecto",
    "timelineValue": "1 mes",
    "timelineLabel": "plazo mínimo",
    "cta": "Crear mi invitación",
    "ctaNote": "Se abre en WhatsApp",
    "ctaAria": "Crear una invitación personalizada por WhatsApp",
    "whatsappMessage": "¡Hola! Me gustaría crear una invitación 100 % personalizada."
  },
```

- [ ] **Step 6: Run WhatsApp and translation-parity tests**

Run:

```bash
npx vitest run tests/landing-whatsapp.test.ts tests/messages-parity.test.ts
```

Expected: PASS; the WhatsApp URL is encoded correctly and PT/EN/ES expose identical leaf keys.

- [ ] **Step 7: Commit the localization unit**

```bash
git add messages/pt.json messages/en.json messages/es.json tests/landing-whatsapp.test.ts
git commit -m "feat: localize custom invitation section"
```

---

### Task 3: Minimal Custom-Invitation Strip

**Files:**

- Create: `tests/custom-invitation-section.test.ts`
- Create: `components/landing/CustomInvitationSection.tsx`
- Modify: `components/landing/BrindealHomepage.tsx:12-23`
- Modify: `components/landing/BrindealHomepage.tsx:48-53`

**Interfaces:**

- Consumes: `currentCurrency: Currency`, `getCustomInvitationPrice(currency: Currency): string`, the `LandingCustomInvitation` translation namespace, `buildWhatsappUrl(message?: string): string`, `AnimatedSection`, and `WhatsAppIcon`.
- Produces: `CustomInvitationSection({ currentCurrency }: { currentCurrency: Currency }): React.JSX.Element`.

- [ ] **Step 1: Write the failing server-render component test**

Create `tests/custom-invitation-section.test.ts`:

```ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { CustomInvitationSection } from "@/components/landing/CustomInvitationSection";
import pt from "../messages/pt.json";

function renderSection() {
  return renderToStaticMarkup(
    createElement(
      NextIntlClientProvider,
      { locale: "pt", messages: pt },
      createElement(CustomInvitationSection, { currentCurrency: "EUR" }),
    ),
  );
}

describe("CustomInvitationSection", () => {
  it("renders the approved copy and fixed price", () => {
    const html = renderSection();

    expect(html).toContain("Ainda não encontrou o convite certo?");
    expect(html).toContain("250");
    expect(html).toContain("preço do projeto");
    expect(html).toContain("1 mês");
    expect(html).not.toContain("Desde");
  });

  it("renders an accessible localized WhatsApp CTA", () => {
    const html = renderSection();

    expect(html).toContain('target="_blank"');
    expect(html).toContain(
      'aria-label="Criar um convite personalizado pelo WhatsApp"',
    );
    expect(html).toContain(
      "https://wa.me/351910671757?text=Ol%C3%A1!%20Gostaria%20de%20criar%20um%20convite%20100%25%20personalizado.",
    );
  });
});
```

- [ ] **Step 2: Run the component test and verify the expected red state**

Run:

```bash
npx vitest run tests/custom-invitation-section.test.ts
```

Expected: FAIL because `@/components/landing/CustomInvitationSection` does not exist.

- [ ] **Step 3: Create the custom-invitation component**

Create `components/landing/CustomInvitationSection.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { WhatsAppIcon } from "@/components/shared/icons/WhatsAppIcon";
import type { Currency } from "@/lib/currency/config";
import { getCustomInvitationPrice } from "@/lib/custom-invitation";
import { buildWhatsappUrl } from "@/lib/landing-whatsapp";
import { AnimatedSection } from "./AnimatedSection";
import { SectionEyebrow } from "./SectionEyebrow";

export function CustomInvitationSection({
  currentCurrency,
}: {
  currentCurrency: Currency;
}) {
  const t = useTranslations("LandingCustomInvitation");
  const price = getCustomInvitationPrice(currentCurrency);
  const whatsappHref = buildWhatsappUrl(t("whatsappMessage"));

  return (
    <AnimatedSection className="bg-background px-5 pb-24 sm:px-8 lg:pb-28">
      <div className="mx-auto max-w-7xl bg-primary-soft px-6 py-12 sm:px-10 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)_auto] lg:items-center lg:gap-8 lg:px-12 lg:py-14">
        <div className="text-center lg:text-left">
          <div className="flex justify-center lg:justify-start">
            <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground lg:mx-0">
            {t("body")}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 border-y border-primary/15 py-6 text-center lg:mt-0 lg:border-x lg:border-y-0 lg:px-8 lg:py-2">
          <div>
            <p className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
              {price}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("priceLabel")}
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
              {t("timelineValue")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("timelineLabel")}
            </p>
          </div>
        </div>

        <div className="mt-8 lg:mt-0">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-label={t("ctaAria")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_9px_24px_color-mix(in_srgb,var(--primary)_22%,transparent)] transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 lg:w-auto"
          >
            <WhatsAppIcon className="size-4" aria-hidden="true" />
            {t("cta")}
          </a>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {t("ctaNote")}
          </p>
        </div>
      </div>
    </AnimatedSection>
  );
}
```

- [ ] **Step 4: Run the component test and verify green**

Run:

```bash
npx vitest run tests/custom-invitation-section.test.ts
```

Expected: PASS, 2 tests passed.

- [ ] **Step 5: Insert the section after the Gallery**

Add this import to `components/landing/BrindealHomepage.tsx` with the other landing-section imports:

```ts
import { CustomInvitationSection } from "./CustomInvitationSection";
```

Insert the component immediately after the closing `GallerySection` tag and before `ProcessSection`:

```tsx
      <CustomInvitationSection currentCurrency={currentCurrency} />
      <ProcessSection />
```

- [ ] **Step 6: Run focused static verification**

Run:

```bash
npx eslint components/landing/CustomInvitationSection.tsx components/landing/BrindealHomepage.tsx lib/custom-invitation.ts tests/custom-invitation.test.ts tests/custom-invitation-section.test.ts tests/landing-whatsapp.test.ts
```

Expected: exit code 0 with no lint errors.

Run:

```bash
npx tsc --noEmit
```

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 7: Run all feature-level tests**

Run:

```bash
npx vitest run tests/custom-invitation.test.ts tests/custom-invitation-section.test.ts tests/currency.test.ts tests/landing-price.test.ts tests/landing-whatsapp.test.ts tests/messages-parity.test.ts
```

Expected: PASS with no failed tests.

- [ ] **Step 8: Start the landing page and perform visual QA**

Run:

```bash
npm run dev
```

Use the in-app browser to inspect the landing page at desktop width and at approximately 390 px mobile width.

Verify:

- The strip appears once, directly after the last Gallery collection and before “Como funciona”.
- Desktop has three aligned areas: copy, price/timeline, and CTA.
- Mobile stacks copy, facts, and CTA; price and timeline stay side by side.
- The CTA is full-width on mobile and content-width on desktop.
- EUR displays `250 €` with no `Desde`.
- Selecting MZN displays `17 500 MZN`; other supported currencies update without reload errors.
- Portuguese, English, and Spanish copy fits without clipping.
- Keyboard focus is visible on the CTA.
- The CTA URL targets `wa.me/351910671757` and contains the localized message.
- With reduced motion enabled, the section does not animate.

- [ ] **Step 9: Run the full project verification**

Stop the development server, then run:

```bash
npm test
npm run lint
npm run build
```

Expected: all Vitest suites pass, ESLint exits with no errors, and the required Prisma-aware Next.js build exits successfully.

- [ ] **Step 10: Review the final diff against the specification**

Run:

```bash
git diff --check
git status --short
git diff -- components/landing/CustomInvitationSection.tsx components/landing/BrindealHomepage.tsx lib/custom-invitation.ts messages/pt.json messages/en.json messages/es.json tests/custom-invitation.test.ts tests/custom-invitation-section.test.ts tests/landing-whatsapp.test.ts
```

Confirm:

- No `Desde` string is introduced by the custom-invitation helper or component.
- No files outside the plan are modified.
- No database, API, admin, navigation, analytics, form, modal, or dependency changes are present.

- [ ] **Step 11: Commit the completed UI**

```bash
git add components/landing/CustomInvitationSection.tsx components/landing/BrindealHomepage.tsx tests/custom-invitation-section.test.ts
git commit -m "feat: add custom invitation landing section"
```
