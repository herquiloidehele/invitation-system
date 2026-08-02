# Remove Kwanza and Use EUR for Angola Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove AOA/Kwanza from active currency behavior and make Angola resolve to EUR without modifying existing stored AOA data.

**Architecture:** Keep the active currency union limited to EUR, MZN, BRL, and USD. Add one pure normalization boundary for legacy persisted values (`AOA` becomes EUR; unknown values use EUR), then apply it to persisted currency reads and new currency writes. Keep existing AOA JSON untouched because the override schema will no longer accept or expose it.

**Tech Stack:** TypeScript, Vitest, Zod, Next.js App Router, Prisma JSON fields, next-intl translation JSON.

## Global Constraints

- Existing stored AOA `currency` values and AOA keys in `priceOverrides` must not be migrated, deleted, or rewritten.
- Angola (`AO`) must resolve to EUR for new geo-based currency decisions.
- AOA must not appear in `SUPPORTED_CURRENCIES`, the public selector, active formatting tables, or new override validation.
- Preserve EUR, MZN, BRL, and USD behavior and rates.
- Use `npm run build` rather than invoking `next build` directly.
- Do not commit `.env.development` or `.env.production`.

---

## File Map

- `lib/currency/config.ts`: active currency list, country mapping, rates, formatting tables, and legacy-value normalization.
- `lib/currency/template-price.ts`: active override keys and Zod schema.
- `lib/currency/viewer-currency.ts`: cookie resolution boundary.
- `lib/landing-price.ts`: safe formatting boundary for legacy stored currency strings.
- `lib/invitations.ts` and `lib/invitation-admin-initial-data.ts`: normalize persisted currency values returned to public/admin consumers.
- `lib/invitation-create-data.ts`, `app/api/admin/invitations/[id]/route.ts`, `app/api/admin/save-the-date/route.ts`, and `app/api/admin/save-the-date/[id]/route.ts`: normalize new or updated currency writes to the active model.
- `components/admin/LandingMetadataFieldset.tsx`: automatically follows the reduced override list; no new currency UI is needed beyond the shared list.
- `messages/en.json`, `messages/pt.json`, `messages/es.json`: remove the Kwanza selector label.
- `prisma/schema.prisma`: update comments only; do not change columns or create a migration.
- `tests/currency.test.ts`, `tests/landing-countries.test.ts`, `tests/locale-currency-menu.test.ts`, `tests/currency-viewer.test.ts`, `tests/landing-price.test.ts`, and `tests/invitation-create-data.test.ts`: regression coverage.

### Task 1: Reduce the active currency model and add legacy normalization

**Files:**
- Modify: `lib/currency/config.ts`
- Test: `tests/currency.test.ts`
- Test: `tests/landing-countries.test.ts`

**Interfaces:**
- Produces `type Currency = "EUR" | "MZN" | "BRL" | "USD"`.
- Produces `normalizeCurrency(value: unknown): Currency`.
- Preserves `currencyForCountry(country)` and `isSupportedCurrency(value)` signatures.

- [ ] **Step 1: Write the failing tests**

Update `tests/currency.test.ts` to import `normalizeCurrency` and change the explicit-market expectation to:

```ts
it("maps Angola to the EUR fallback and keeps other explicit markets", () => {
  expect(currencyForCountry("MZ")).toBe("MZN");
  expect(currencyForCountry("AO")).toBe("EUR");
  expect(currencyForCountry("BR")).toBe("BRL");
  expect(currencyForCountry("US")).toBe("USD");
});
```

Add these behaviors:

```ts
it("normalizes legacy and unknown persisted currency values", () => {
  expect(normalizeCurrency("AOA")).toBe("EUR");
  expect(normalizeCurrency("EUR")).toBe("EUR");
  expect(normalizeCurrency("MZN")).toBe("MZN");
  expect(normalizeCurrency("GBP")).toBe("EUR");
  expect(normalizeCurrency(null)).toBe("EUR");
});

it("accepts only active currency codes", () => {
  for (const code of ["EUR", "MZN", "BRL", "USD"]) {
    expect(isSupportedCurrency(code)).toBe(true);
  }
  expect(isSupportedCurrency("AOA")).toBe(false);
});
```

Remove AOA from the existing `deriveCents` and supported-currency test cases. In `tests/landing-countries.test.ts`, retain Angola in `SERVED_COUNTRY_CODES` and assert that every served country, including AO, maps to a supported currency.

- [ ] **Step 2: Run the focused tests and verify they fail for the intended reason**

Run:

```bash
npx vitest run tests/currency.test.ts tests/landing-countries.test.ts
```

Expected: FAIL because AO still maps to AOA, AOA is still supported, and `normalizeCurrency` does not exist.

- [ ] **Step 3: Implement the minimal configuration change**

In `lib/currency/config.ts`:

```ts
export const SUPPORTED_CURRENCIES = ["EUR", "MZN", "BRL", "USD"] as const;

const COUNTRY_CURRENCY: Record<string, Currency> = {
  MZ: "MZN",
  BR: "BRL",
  US: "USD",
};

export function normalizeCurrency(value: unknown): Currency {
  if (value === "AOA") return FALLBACK_CURRENCY;
  return isSupportedCurrency(value) ? value : FALLBACK_CURRENCY;
}
```

Remove AOA from `EUR_RATES`, `ROUND_STEP`, `CURRENCY_LOCALE`, and `CURRENCY_SYMBOL`. Keep the existing fallback implementation so AO and all unlisted countries resolve to EUR.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run:

```bash
npx vitest run tests/currency.test.ts tests/landing-countries.test.ts
```

Expected: PASS with no AOA-related failures.

- [ ] **Step 5: Commit the active currency model**

```bash
git add lib/currency/config.ts tests/currency.test.ts tests/landing-countries.test.ts
git commit -m "feat: use EUR for Angola currency detection"
```

### Task 2: Remove AOA from overrides, selector labels, and formatting boundaries

**Files:**
- Modify: `lib/currency/template-price.ts`
- Modify: `lib/currency/viewer-currency.ts`
- Modify: `lib/landing-price.ts`
- Modify: `lib/invitations.ts`
- Modify: `lib/invitation-admin-initial-data.ts`
- Modify: `messages/en.json`
- Modify: `messages/pt.json`
- Modify: `messages/es.json`
- Modify: `prisma/schema.prisma`
- Test: `tests/currency.test.ts`
- Test: `tests/locale-currency-menu.test.ts`
- Test: `tests/currency-viewer.test.ts`
- Test: `tests/landing-price.test.ts`

**Interfaces:**
- Consumes `normalizeCurrency(value: unknown): Currency` from Task 1.
- Produces active `OVERRIDE_CURRENCIES = ["MZN", "BRL", "USD"] as const`.
- Keeps legacy AOA JSON readable only as untyped stored data; it is not accepted by the active `PriceOverrides` type.

- [ ] **Step 1: Write the failing tests**

In `tests/currency.test.ts`, update the override test to assert that AOA is rejected:

```ts
it("rejects EUR and legacy AOA override keys", () => {
  expect(priceOverridesSchema.safeParse({ EUR: { fromCents: 100 } }).success).toBe(false);
  expect(priceOverridesSchema.safeParse({ AOA: { fromCents: 100 } }).success).toBe(false);
});
```

In `tests/locale-currency-menu.test.ts`, change the expected symbol map to exactly:

```ts
expect(CURRENCY_SYMBOL).toEqual({
  EUR: "€",
  MZN: "MZN",
  BRL: "R$",
  USD: "$",
});
```

In `tests/landing-price.test.ts`, remove the AOA formatting assertion and keep EUR, USD, BRL, and MZN coverage. Add a legacy boundary assertion:

```ts
it("formats a legacy AOA value as EUR", () => {
  expect(formatLandingPrice(14900, "AOA")).toBe("Desde 149 €");
});
```

In `tests/currency-viewer.test.ts`, add an explicit legacy-cookie case:

```ts
it("does not preserve a legacy AOA cookie", async () => {
  cookieStore.set("currency", "AOA");
  expect(await getViewerCurrency()).toBe("EUR");
});
```

- [ ] **Step 2: Run the focused tests and verify they fail for the intended reason**

Run:

```bash
npx vitest run tests/currency.test.ts tests/locale-currency-menu.test.ts tests/currency-viewer.test.ts tests/landing-price.test.ts
```

Expected: FAIL because AOA remains in the override schema/symbol map and the formatter still emits a Kwanza value.

- [ ] **Step 3: Implement the active override and read-time boundaries**

In `lib/currency/template-price.ts`, reduce the override list and schema:

```ts
export const OVERRIDE_CURRENCIES = ["MZN", "BRL", "USD"] as const;

export const priceOverridesSchema = z
  .object({
    MZN: entrySchema.optional(),
    BRL: entrySchema.optional(),
    USD: entrySchema.optional(),
  })
  .strict()
  .nullable()
  .optional();
```

In `lib/currency/viewer-currency.ts`, keep the existing explicit-cookie precedence while making the legacy mapping explicit: accept active values, ignore AOA as an active choice, then check the geo cookie, and finally return EUR. This preserves the current behavior where an invalid explicit cookie does not suppress a valid geo cookie.

In `lib/landing-price.ts`, normalize the incoming string before passing it to `Intl.NumberFormat` or looking up a symbol:

```ts
const activeCurrency = normalizeCurrency(currency);
const formatter = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: activeCurrency,
  maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
});
const symbol = CURRENCY_SYMBOL[activeCurrency];
```

Use the normalized currency for the returned currency parts while preserving the caller’s locale.

Normalize `row.currency` with `normalizeCurrency` when constructing public invitation data in `lib/invitations.ts` and admin initial data in `lib/invitation-admin-initial-data.ts`. This ensures old records cannot re-enter typed consumers as AOA.

Delete the `AOA`/`Kwanza` entry from each `LocaleCurrencyMenu.currencyNames` object. Update both Prisma `priceOverrides` comments to list only `MZN`, `BRL`, and `USD`; do not edit the schema shape or create a migration.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run:

```bash
npx vitest run tests/currency.test.ts tests/locale-currency-menu.test.ts tests/currency-viewer.test.ts tests/landing-price.test.ts
```

Expected: PASS, including legacy AOA fallback coverage.

- [ ] **Step 5: Commit the override and formatting boundaries**

```bash
git add lib/currency/template-price.ts lib/currency/viewer-currency.ts lib/landing-price.ts lib/invitations.ts lib/invitation-admin-initial-data.ts messages/en.json messages/pt.json messages/es.json prisma/schema.prisma tests/currency.test.ts tests/locale-currency-menu.test.ts tests/currency-viewer.test.ts tests/landing-price.test.ts
git commit -m "feat: remove Kwanza from active pricing"
```

### Task 3: Normalize future currency writes and complete regression verification

**Files:**
- Modify: `lib/invitation-create-data.ts`
- Modify: `app/api/admin/invitations/[id]/route.ts`
- Modify: `app/api/admin/save-the-date/route.ts`
- Modify: `app/api/admin/save-the-date/[id]/route.ts`
- Test: `tests/invitation-create-data.test.ts`
- Modify: `prisma/schema.prisma` only if Task 2 did not update its comments.

**Interfaces:**
- Consumes `normalizeCurrency(value: unknown): Currency` from Task 1.
- Future invitation and Save the Date writes store only an active currency, with invalid/legacy values becoming EUR.
- Existing rows are not touched unless explicitly updated through one of these write paths.

- [ ] **Step 1: Write the failing write-boundary test**

In `tests/invitation-create-data.test.ts`, add:

```ts
it("stores EUR when a new invitation submits the legacy AOA currency", () => {
  const body = duplicateForm({ currency: "AOA" });
  const data = buildInvitationCreateData(body, "theme_copy");
  expect(data.currency).toBe("EUR");
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npx vitest run tests/invitation-create-data.test.ts
```

Expected: FAIL because the create-data builder currently copies the submitted string unchanged.

- [ ] **Step 3: Implement write normalization**

Replace each currency write fallback that currently checks only for a non-empty string with the shared normalizer. For example, in `lib/invitation-create-data.ts`:

```ts
currency: normalizeCurrency(body.currency),
```

Apply the same behavior to invitation update and Save the Date create/update routes. Keep `readPriceOverridesInput` unchanged: old AOA JSON is preserved when no override payload is sent, while a newly submitted AOA override payload is rejected by the strict schema and stored as JSON null according to the existing helper contract.

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
npx vitest run tests/invitation-create-data.test.ts
```

Expected: PASS with the new legacy-write regression covered.

- [ ] **Step 5: Run all repository tests**

Run:

```bash
npm test
```

Expected: exit code 0 and no failed tests. If unrelated pre-existing failures occur, record their exact names and output rather than changing unrelated code.

- [ ] **Step 6: Run lint and the repository build**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands exit 0. `npm run build` is the required project command because it regenerates Prisma and deploys migrations before building; no separate migration is expected for this change.

- [ ] **Step 7: Review the final diff and commit verification-ready changes**

Run:

```bash
git status --short
git diff --check
rg -n -S --glob '!node_modules' --glob '!lib/generated/**' 'AOA|Kwanza|Kz' lib app components messages prisma tests
```

The final search may show only intentional legacy-normalization tests/comments; it must not show AOA in the active supported list, override schema, selector translations, rates, locales, symbols, or admin override list.

```bash
git add lib/invitation-create-data.ts 'app/api/admin/invitations/[id]/route.ts' app/api/admin/save-the-date/route.ts 'app/api/admin/save-the-date/[id]/route.ts' tests/invitation-create-data.test.ts
git commit -m "feat: normalize future currency writes"
```
