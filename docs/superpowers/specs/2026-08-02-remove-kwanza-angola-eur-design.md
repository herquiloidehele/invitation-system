# Remove Kwanza and Use EUR for Angola

## Context

The landing-page currency system currently supports EUR, MZN, AOA, BRL, and USD. Angola (`AO`) is mapped to AOA, the public language/currency menu exposes Kwanza, and landing-price overrides can contain AOA-specific values.

The requested behavior is to remove Kwanza from the active currency model and make Angola use EUR automatically. Existing stored AOA values must remain untouched; this is a forward-compatible application change, not a data migration.

## Goals

- Resolve Angola (`AO`) to EUR for new geo-based currency decisions.
- Remove AOA from the supported currency union and public currency selector.
- Stop accepting new AOA price overrides through admin APIs and forms.
- Keep legacy stored AOA values and overrides intact in the database.
- Prevent legacy AOA cookies or stored values from causing invalid currency formatting; normalize them to EUR at read time.
- Preserve all other currency behavior and rates.

## Non-goals

- No database update or migration of existing `currency` columns.
- No deletion or rewriting of existing `priceOverrides` JSON.
- No change to the prices or exchange rates for EUR, MZN, BRL, or USD.
- No change to the list of served countries; Angola remains a served market.

## Design

### Currency configuration

Update `lib/currency/config.ts` so AOA is not in `SUPPORTED_CURRENCIES`, and map `AO` directly to EUR through the existing fallback behavior. Remove AOA entries from EUR rates, rounding steps, locales, and symbols. Add a small read-time normalization helper for legacy currency strings: AOA resolves to EUR, supported currencies pass through, and unknown values use the EUR fallback.

The existing `isSupportedCurrency` behavior remains strict for new values. This keeps AOA out of cookies, selector choices, and new API data while the normalization helper protects read paths that may encounter legacy database values.

### Runtime boundaries

Use the normalization helper where persisted or cookie-derived currency values enter the application:

- viewer currency resolution treats a legacy AOA cookie as EUR;
- landing/template price resolution treats legacy stored currency values as EUR before formatting or conversion;
- one-off currency formatting helpers receive a valid active currency after normalization.

Legacy AOA override keys remain in stored JSON but are no longer part of the validated `PriceOverrides` type or admin editor. Since Angola now resolves to EUR, those overrides are not consulted for Angola.

### Admin and translations

Remove AOA from `OVERRIDE_CURRENCIES` and the Zod override schema so future writes cannot create new AOA overrides. Existing invalid/legacy JSON remains untouched when no override update is submitted.

Remove the AOA/Kwanza entry from all `LocaleCurrencyMenu.currencyNames` translation objects. The existing selector will then render only active currencies from the shared supported-currency list.

Update Prisma comments that enumerate override currencies so documentation matches runtime behavior. The schema remains structurally unchanged because stored legacy values are intentionally preserved.

## Data flow

```text
country/cookie/persisted value
            |
            v
   normalize legacy currency
            |
            +--> active currency model (EUR, MZN, BRL, USD)
                         |
                         +--> selector / pricing / formatting
```

For Angola specifically:

```text
AO geo lookup -> currencyForCountry("AO") -> EUR -> EUR price display
```

## Error handling

- Unsupported or malformed cookie values continue to fall back to EUR.
- Legacy `AOA` values normalize to EUR rather than reaching `Intl.NumberFormat` or an active-currency lookup.
- Existing stored AOA override JSON is preserved and ignored by active pricing paths.

## Testing

Update the existing currency tests to verify:

- `AO` resolves to EUR;
- AOA is absent from supported currencies and selector symbols;
- legacy AOA normalizes to EUR;
- legacy AOA viewer cookies fall back to EUR;
- the override schema rejects new AOA keys;
- urgency and landing-price formatting still works for every active currency;
- Angola remains in the served-country list and maps to a supported currency.

Run the focused currency/landing tests first, then the full test suite, lint, and the repository build command (`npm run build`) if the environment permits database migration/build execution.

## Alternatives considered

1. **Configuration-only removal**: smallest diff, but legacy stored AOA values could reach formatting code and fail or display inconsistently.
2. **Configuration plus read-time normalization (selected)**: removes AOA from all new behavior, safely handles old values, and avoids destructive data changes.
3. **UI-only hiding**: leaves AOA active internally, so it does not fully satisfy removing Kwanza from the currency model.
