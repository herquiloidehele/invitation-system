# Rich External Link Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Couple Gallery, Gifts, and FAQs to the rich external-link invitation page and expose the same configuration and preview styling controls already available to standard invitations.

**Architecture:** Keep the existing `InvitationData` JSON contract and external-link lifecycle. Extend the rich-layout predicate, reuse the existing gallery and gifts components, extract the FAQ section into a shared component consumed by both page types, and add the standard section editors plus full inline text/card/spacing preview wiring to `ExternalInvitationForm`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Framer Motion, next-intl, shadcn/ui, Vitest, Prisma-backed JSON fields.

## Global Constraints

- Render the new sections after `CanvaEmbed` in this order: Couple Gallery → Gifts → FAQs → Places → RSVP.
- Reuse the existing `InvitationData` fields; do not add a Prisma migration or parallel JSON schema.
- Preserve standard invitation behavior by making `InvitationPage` consume the extracted FAQ component.
- Use `shouldRenderCoupleGallery()` and `shouldRenderPlaces()` for content-aware layout gating.
- Keep the external RSVP rule: render it only while the Canva iframe is on its initial page.
- Run builds with `npm run build`; never invoke `next build` directly.
- Vitest runs in Node without a DOM; use pure helper tests and source-contract tests rather than DOM-dependent tests.

---

### Task 1: Expand rich external-layout gating

**Files:**
- Modify: `lib/external-invitation-form.ts` (`hasRichExternalSections`)
- Test: `tests/external-invitation-form.test.ts`

**Interfaces:**
- Consumes: `InvitationData`, `shouldRenderCoupleGallery`, and `shouldRenderPlaces`.
- Produces: `hasRichExternalSections(invitation: InvitationData): boolean` returning true for any renderable rich section.

- [ ] **Step 1: Add failing gate tests**

Extend `tests/external-invitation-form.test.ts` to import `hasRichExternalSections` and add a small `baseExternalInvitation(overrides)` fixture with an empty hero, disabled countdown/scratch/RSVP, disabled gifts, empty FAQ list, and an empty Places configuration. Assert these cases:

```ts
it.each([
  ["gallery", { coupleGallery: { enabled: true, style: "grid", images: [{ src: "gallery.jpg" }] } }],
  ["gifts", { giftRegistry: { enabled: true, text: "" } }],
  ["faqs", { faqs: [{ question: "Q", answer: "A" }] }],
  ["places", { places: { enabled: true, layout: "stacked", sections: [{ id: "hotels", title: "Hotels", items: [{ id: "hotel", title: "Hotel" }] }] } }],
])("uses rich layout for %s", (_name, overrides) => {
  expect(hasRichExternalSections(baseExternalInvitation(overrides))).toBe(true);
});

it.each([
  { coupleGallery: { enabled: true, style: "grid", images: [] } },
  { giftRegistry: { enabled: false, text: "" } },
  { faqs: [] },
  { places: { enabled: true, layout: "stacked", sections: [] } },
])("does not activate rich layout for empty optional content", (overrides) => {
  expect(hasRichExternalSections(baseExternalInvitation(overrides))).toBe(false);
});
```

The fixture may use `as InvitationData` for the fields that are irrelevant to this pure helper, following the existing `baseInvitation` pattern in `tests/social-preview.test.ts`.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run tests/external-invitation-form.test.ts`

Expected: FAIL because `hasRichExternalSections` does not yet consider gallery, gifts, FAQs, or Places.

- [ ] **Step 3: Implement the expanded predicate**

In `lib/external-invitation-form.ts`, import the two existing predicates and extend the function without changing its external-link guard:

```ts
const galleryOn = shouldRenderCoupleGallery(invitation);
const giftsOn = invitation.giftRegistry.enabled === true;
const faqsOn = (invitation.faqs?.length ?? 0) > 0;
const placesOn = shouldRenderPlaces(invitation);

return (
  heroOn ||
  countdownOn ||
  scratchOn ||
  galleryOn ||
  giftsOn ||
  faqsOn ||
  placesOn ||
  rsvpAtEndOn
);
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npx vitest run tests/external-invitation-form.test.ts`

Expected: PASS, including all existing Canva and RSVP helper tests.

- [ ] **Step 5: Commit the gate change**

```bash
git add lib/external-invitation-form.ts tests/external-invitation-form.test.ts
git commit -m "feat: gate rich external pages for optional sections"
```

### Task 2: Extract the FAQ section for shared rendering

**Files:**
- Create: `components/shared/FaqSection.tsx`
- Modify: `components/shared/InvitationPage.tsx`
- Test: `tests/external-invitation-form.test.ts` (source contract)

**Interfaces:**
- Consumes: `FAQItem[]`, `TemplateTheme`, optional `CustomTexts` and `TextStyleOverrides`, `CardStyle`, and `isPreview`.
- Produces: `FaqSection` default export with the same visual, animation, editing, and accordion behavior currently embedded in `InvitationPage`.

- [ ] **Step 1: Capture the current FAQ contract in a source test**

Add this source-contract test to `tests/external-invitation-form.test.ts`; it reads `components/shared/FaqSection.tsx` and keeps the Node-only test environment aligned with the component's required integration points without introducing jsdom:

```ts
it("keeps FAQ rendering editable and stateful", () => {
  const source = readFileSync(
    join(process.cwd(), "components/shared/FaqSection.tsx"),
    "utf8",
  );
  expect(source).toContain("EditableCard");
  expect(source).toContain("EditableText");
  expect(source).toContain("sectionTitle_faqs");
  expect(source).toContain("openFaqIndex");
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run tests/external-invitation-form.test.ts`

Expected: FAIL because `FaqSection.tsx` does not exist.

- [ ] **Step 3: Create the shared FAQ component**

Move the existing `FAQAccordionItem` implementation and the FAQ section markup from `InvitationPage.tsx` into `components/shared/FaqSection.tsx`. Define these props:

```ts
interface FaqSectionProps {
  faqs: FAQItem[];
  theme: TemplateTheme;
  textStyles?: TextStyleOverrides;
  customTexts?: CustomTexts;
  cardStyle: CardStyle;
  isPreview?: boolean;
}
```

Inside the component:

- resolve text styles with `resolveTextStyles(theme, textStyles)`;
- resolve the localized/custom section title with `useCustomText(customTexts)` and `sectionTitle_faqs`;
- keep `openFaqIndex` local to the component;
- preserve the current `FAQAccordionItem` animation and `EditableText` element keys;
- wrap the card with `<EditableCard sectionKey="faqs">`;
- use `cardStyle.cardBg`, `cardStyle.cardBorder`, `cardStyle.borderRadius`, and the resolved accent with the same default fallback values as the standard page.

- [ ] **Step 4: Replace the inline standard-page FAQ block**

In `components/shared/InvitationPage.tsx`, remove the local FAQ item component, the local `openFaqIndex` state, and the old FAQ markup. Import `FaqSection` and render it under the existing FAQ predicate:

```tsx
{invitation.faqs && invitation.faqs.length > 0 && (
  <SectionImageHost sectionKey="faqs" layer={invitation.imageLayer}>
    <SectionDivider theme={theme} />
    <FaqSection
      faqs={invitation.faqs}
      theme={theme}
      textStyles={invitation.textStyles}
      customTexts={invitation.customTexts}
      cardStyle={cs("faqs", 20)}
      isPreview={isPreview}
    />
  </SectionImageHost>
)}
```

Remove imports that become unused and keep the existing standard page wrapper, image host, divider, and section ordering unchanged.

- [ ] **Step 5: Run tests and lint for the extraction**

Run: `npx vitest run tests/external-invitation-form.test.ts tests/invitation-page-image-hosts.test.ts && npm run lint`

Expected: PASS with no unused imports or formatting errors.

- [ ] **Step 6: Commit the shared FAQ extraction**

```bash
git add components/shared/FaqSection.tsx components/shared/InvitationPage.tsx tests/external-invitation-form.test.ts
git commit -m "refactor: share FAQ section rendering"
```

### Task 3: Compose the new sections in `RichExternalLinkPage`

**Files:**
- Modify: `components/shared/RichExternalLinkPage.tsx`
- Test: `tests/external-invitation-form.test.ts` (source contract)

**Interfaces:**
- Consumes: `CoupleGallery`, `GiftsSection`, `FaqSection`, `PlacesSection`, `shouldRenderCoupleGallery`, and the existing `InvitationData` fields.
- Produces: the public and admin-preview rich external page with Canva → gallery → gifts → FAQs → Places → RSVP ordering.

- [ ] **Step 1: Add failing composition assertions**

Extend the source-contract tests with this order assertion:

```ts
it("composes rich external sections after Canva in the approved order", () => {
  const source = readFileSync(
    join(process.cwd(), "components/shared/RichExternalLinkPage.tsx"),
    "utf8",
  );
  for (const name of [
    "CanvaEmbed",
    "CoupleGallery",
    "GiftsSection",
    "FaqSection",
    "PlacesSection",
    "RSVPForm",
  ]) {
    expect(source).toContain(name);
  }
  expect(source.indexOf("<CanvaEmbed")).toBeLessThan(
    source.indexOf("<CoupleGallery"),
  );
  expect(source.indexOf("<CoupleGallery")).toBeLessThan(
    source.indexOf("<GiftsSection"),
  );
  expect(source.indexOf("<GiftsSection")).toBeLessThan(
    source.indexOf("<FaqSection"),
  );
  expect(source.indexOf("<FaqSection")).toBeLessThan(
    source.indexOf("<PlacesSection"),
  );
  expect(source.indexOf("<PlacesSection")).toBeLessThan(
    source.indexOf("<RSVPForm"),
  );
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run tests/external-invitation-form.test.ts`

Expected: FAIL because the rich page currently has no gallery, gifts, or shared FAQ composition.

- [ ] **Step 3: Add shared-section imports and style helpers**

In `RichExternalLinkPage.tsx`, import `useCustomText`, `resolveTextStyles`, `CoupleGallery`, `GiftsSection`, `FaqSection`, `EditableCard`, `shouldRenderCoupleGallery`, and `CardSectionKey`. Add the same card-style resolver used by the standard page:

```ts
const ts = resolveTextStyles(theme, invitation.textStyles);
const t = useCustomText(invitation.customTexts);
const cs = (section: CardSectionKey, defaultRadius: number) => ({
  cardBg: invitation.cardStyles?.[section]?.cardBg || theme.cardBg,
  cardBorder: invitation.cardStyles?.[section]?.cardBorder || theme.cardBorder,
  borderRadius:
    invitation.cardStyles?.[section]?.borderRadius ?? defaultRadius,
  accentColor: invitation.cardStyles?.[section]?.accentColor,
});
```

- [ ] **Step 4: Render the sections after Canva**

Immediately after `<CanvaEmbed ... />`, add the approved order. Use `CoupleGallery` directly, wrap the gift section in `EditableCard sectionKey="giftRegistry"` with the existing standard gift card styles, and pass `cardStyle={cs("faqs", 20)}` to `FaqSection`. Keep the existing Places and RSVP blocks after the new content.

The gifts call must pass `giftRegistry`, `theme`, `ts`, `cardStyle={cs("giftRegistry", 16)}`, `slug={invitation.slug}`, `guestToken={invitation.guest?.token}`, and `t={t}`. Use the existing `SectionOrnament` between optional sections to retain the rich page's visual divider language.

- [ ] **Step 5: Run the focused tests and lint**

Run: `npx vitest run tests/external-invitation-form.test.ts && npm run lint`

Expected: PASS, with the source-order assertions proving the public composition order.

- [ ] **Step 6: Commit the rich-page composition**

```bash
git add components/shared/RichExternalLinkPage.tsx tests/external-invitation-form.test.ts
git commit -m "feat: render optional sections on rich external pages"
```

### Task 4: Add full section configuration to the external invitation editor

**Files:**
- Modify: `app/admin/invitations/ExternalInvitationForm.tsx`
- Test: `tests/external-invitation-form.test.ts` (source contract)
- Reuse unchanged: `components/admin/CoupleGalleryEditor.tsx`, `components/admin/GiftsListEditor.tsx`, `components/admin/BankTransferEditor.tsx`

**Interfaces:**
- Consumes: existing `InvitationData` state, `sourceForm`, `structureLocked`, `CoupleGalleryEditor`, `GiftsListEditor`, and `BankTransferEditor`.
- Produces: controlled editor state for `coupleGallery`, `giftRegistry.items`, `giftRegistry.bankTransfer`, and `faqs`, plus complete inline card/spacing preview updates.

- [ ] **Step 1: Add failing external-editor source assertions**

Extend `tests/external-invitation-form.test.ts` with this source-contract assertion:

```ts
it("exposes full optional-section editing in the external form", () => {
  const source = readFileSync(
    join(process.cwd(), "app/admin/invitations/ExternalInvitationForm.tsx"),
    "utf8",
  );
  for (const token of [
    "CoupleGalleryEditor",
    "GiftsListEditor",
    "BankTransferEditor",
    "addFaq",
    "updateFaq",
    "removeFaq",
    "form.cardStyles",
    "form.spacingStyles",
    "updateSectionSpacing",
  ]) {
    expect(source).toContain(token);
  }
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run tests/external-invitation-form.test.ts`

Expected: FAIL because the external editor currently exposes none of the three section editors and only has countdown-specific card wiring.

- [ ] **Step 3: Extend imports and create-mode defaults**

Import the shared editor components and the `BankTransferDetail`, `CoupleGallery`, `FAQItem`, and `GiftItem` types. Add these controlled defaults in `getDefaultState()`:

```ts
coupleGallery: { enabled: false, style: "kenburns", images: [] },
faqs: [],
```

Keep the existing `giftRegistry` default and ensure persisted `initialData` is still used as-is.

- [ ] **Step 4: Add state update helpers**

Mirror the standard editor's updater contracts:

```ts
const updateCoupleGallery = useCallback((next: CoupleGallery) => {
  setForm((prev) => ({ ...prev, coupleGallery: next }));
}, []);

const updateGiftItems = useCallback((items: GiftItem[]) => {
  setForm((prev) => ({
    ...prev,
    giftRegistry: { ...prev.giftRegistry, items },
  }));
}, []);

const updateBankTransfer = useCallback((bankTransfer: BankTransferDetail[]) => {
  setForm((prev) => ({
    ...prev,
    giftRegistry: { ...prev.giftRegistry, bankTransfer },
  }));
}, []);
```

Add FAQ handlers that preserve stable ids and the standard source placeholders:

```ts
const addFaq = useCallback(() => {
  setForm((prev) => ({
    ...prev,
    faqs: [...(prev.faqs ?? []), {
      id: `faq-${crypto.randomUUID()}`,
      question: "",
      answer: "",
    }],
  }));
}, []);

const updateFaq = useCallback((index: number, field: "question" | "answer", value: string) => {
  setForm((prev) => ({
    ...prev,
    faqs: (prev.faqs ?? []).map((faq, i) =>
      i === index ? { ...faq, [field]: value } : faq,
    ),
  }));
}, []);

const removeFaq = useCallback((index: number) => {
  setForm((prev) => ({
    ...prev,
    faqs: (prev.faqs ?? []).filter((_, i) => i !== index),
  }));
}, []);
```

- [ ] **Step 5: Add the three configuration accordions**

Place the new accordions beside the existing external invitation section controls. Use the standard labels and structure-lock behavior:

- Gallery accordion renders `CoupleGalleryEditor value={form.coupleGallery} sourceValue={sourceForm.coupleGallery} structureLocked={structureLocked} onChange={updateCoupleGallery}`.
- Gifts accordion keeps the existing enabled/text/link controls, then renders the exclusive-selection switch, `GiftsListEditor`, bank-transfer text, and `BankTransferEditor` with the corresponding `sourceForm` values.
- FAQs accordion maps `form.faqs`, renders question and answer inputs with `sourcePlaceholder(sourceForm.faqs?.find(...), fallback)`, supports removal, and includes an add button disabled by `structureLocked`.

Do not introduce a second API payload or local-only fields; all controls must update `form` directly so the existing submit handler persists them.

- [ ] **Step 6: Replace countdown-only preview style wiring**

Import `setSpacingOverride` and `SpacingField` from `lib/spacing-styles`. Add the same general handlers used by `InvitationForm`:

```ts
const updateCardStyle = useCallback(
  (section: CardSectionKey, field: keyof CardStyle, value: string | number | undefined) => {
    setForm((prev) => {
      const cardStyles = { ...prev.cardStyles };
      const sectionStyle = { ...cardStyles[section], [field]: value || undefined };
      cardStyles[section] = Object.values(sectionStyle).some((v) => v !== undefined)
        ? sectionStyle
        : undefined;
      return {
        ...prev,
        cardStyles: Object.values(cardStyles).some(Boolean) ? cardStyles : undefined,
      };
    });
  },
  [],
);

const updateSectionSpacing = useCallback(
  (section: string, field: SpacingField, value: number | undefined) => {
    setForm((prev) => ({
      ...prev,
      spacingStyles: setSpacingOverride(
        prev.spacingStyles,
        "sections",
        section,
        field,
        value,
      ),
    }));
  },
  [],
);
```

Replace each `InlineCardEditProvider` use of `updateCountdownCardStyle` with `updateCardStyle`, pass `cardStyles={form.cardStyles}`, `updateSectionSpacing={updateSectionSpacing}`, and `spacingStyles={form.spacingStyles}`. Wrap the preview pane with `SpacingStyleProvider spacingStyles={form.spacingStyles}` so spacing edits are visible immediately.

- [ ] **Step 7: Run the focused tests and lint**

Run: `npx vitest run tests/external-invitation-form.test.ts && npm run lint`

Expected: PASS with no TypeScript/ESLint errors from the new controlled fields or provider props.

- [ ] **Step 8: Commit the external-editor changes**

```bash
git add app/admin/invitations/ExternalInvitationForm.tsx tests/external-invitation-form.test.ts
git commit -m "feat: configure rich external invitation sections"
```

### Task 5: Full verification and handoff

**Files:**
- Verify: `lib/external-invitation-form.ts`
- Verify: `components/shared/FaqSection.tsx`
- Verify: `components/shared/InvitationPage.tsx`
- Verify: `components/shared/RichExternalLinkPage.tsx`
- Verify: `app/admin/invitations/ExternalInvitationForm.tsx`
- Verify: `tests/external-invitation-form.test.ts`

**Interfaces:**
- Consumes: all completed tasks above.
- Produces: verified implementation ready for user review.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`

Expected: all Vitest tests pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: ESLint exits successfully with no warnings promoted to errors.

- [ ] **Step 3: Run the repository build**

Run: `npm run build`

Expected: Prisma client generation, migration deployment, and the Next.js production build complete successfully.

- [ ] **Step 4: Inspect the final diff and working tree**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Confirm that only the requested implementation, tests, and approved planning artifacts are present, and that no `.env` file or generated Prisma output is staged.
