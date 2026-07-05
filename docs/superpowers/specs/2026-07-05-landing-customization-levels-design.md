# Landing Gallery Customization Levels

## Goal

Make it immediately clear which invitation models permit structural and layout changes and which retain a predefined layout. A visitor must be able to understand the distinction before opening a preview and identify each model's level while scanning cards.

This design addresses layout customization only. Guest-name personalization remains a separate optional capability and must not be used as the meaning of “fully customizable.”

## User-facing terminology

The product has exactly two customization levels:

### Fully customizable

The invitation's structure, section order, layout, and visual styling can change. Content such as names, wording, photographs, colors, and typography can also change.

### Pre-designed

Names, wording, photographs, colors, typography, music, and event information can change, but the model's structure and layout remain as shown.

These labels and meanings must remain consistent in the gallery introduction, section headings, the pre-designed card badge, and FAQ. Copy may be translated naturally, but a translation must not imply that a pre-designed model is structurally editable.

## Landing-page experience

The existing gallery becomes a guided, two-part collection.

### Introductory choice

Below the gallery title and description, show two concise explanatory panels side by side on larger screens and stacked on mobile:

- **Fully customizable** — “Change the layout, sections, and visual direction.”
- **Pre-designed** — “Keep the layout and personalize the content and visual details.”

The panels function as in-page navigation and scroll to their corresponding section. They are not filters: selecting one must not hide the other collection. This preserves the visible separation and lets visitors compare both offerings.

The introductory text should use a direct heading such as “How much would you like to customize?” rather than relying on the ambiguous word “personalization.”

### Collection order

Render the collections in this order:

1. Fully customizable invitations
2. Pre-designed invitations

The fully customizable collection appears first because structural flexibility is the distinction the page needs to communicate. Each section includes:

- its customization-level heading;
- one sentence defining what can change;
- the existing event-category controls, limited to event categories populated within that section;
- its model grid.

If a customization level contains no enabled gallery models, omit its navigation panel and section. If only one level has models, retain that section's explanation so users still understand the purchasing constraint.

Changing an event category in one section affects only that section. This avoids unexpectedly hiding models in the other collection and preserves the meaning of the two permanent sections.

### Model cards

Only pre-designed cards display a persistent “Pre-designed” badge. Fully customizable is the normal offering and does not need a badge; its section heading and explanation communicate its level without adding repetitive visual noise to every card.

The pre-designed badge remains visible on desktop and mobile and does not depend on hover. It should be visually secondary to the model image and title but readable against any thumbnail. The card description and preview remain available, but they are not responsible for communicating the constraint.

Pre-designed models in Best Sellers should carry the same badge because that mixed collection appears before the separated gallery. Fully customizable best sellers remain unbadged. The Best Sellers description should briefly establish this convention: models marked “Pre-designed” retain their displayed structure.

## Data model and defaults

Customization level is an intrinsic property of a model, not of one landing-page placement. Add a required `landingCustomizationLevel` string to both `Invitation` and `SaveTheDate`:

- `fully_customizable`
- `pre_designed`

Use `fully_customizable` as the database default and migration value for all existing records. Pre-designed is the exception and must be explicitly selected by an administrator.

The landing data selectors and mapped feature types expose the level for gallery and best-seller items. Server-side normalization treats missing or unknown legacy values as `fully_customizable`, even though the admin APIs accept only the two supported values.

## Admin experience

Add a required “Customization level” control to the existing landing metadata fieldset used by invitation and save-the-date forms. Present the two options as radio cards or a select with short explanations:

- Fully customizable — layout and structure may be changed
- Pre-designed — layout and structure remain fixed

The value is saved with the invitation or save-the-date metadata, not with `LandingFeature`. Therefore the same model cannot show conflicting badges when used in both Best Sellers and Gallery.

The admin landing-page organizer presents Fully Customizable and Pre-designed as separately curated gallery groups. Within each group, the administrator can:

- choose which invitations and save-the-dates appear;
- assign their event category;
- order them;
- enable, disable, or remove their landing placement.

The Pre-designed group is not populated automatically with every pre-designed model. Only models explicitly chosen for that landing group appear in its public section.

The model's stored customization level remains the source of truth. The picker for each group only offers models with the matching level, and existing placements move to the matching admin group when their model level changes. A model cannot be placed in both customization groups. This keeps the public classification consistent while preserving deliberate control over which models are promoted.

## Localization and content consistency

Add all new landing labels and explanatory copy to the existing Portuguese, English, and Spanish message files.

Update the customization FAQ in each locale to define both levels using the same language as the gallery. References to guest-name personalization must continue to describe that feature separately.

Avoid isolated claims such as “all models are customizable” unless the sentence immediately explains that the degree of customization differs.

## Accessibility and responsive behavior

- Introductory panels are links or buttons with visible keyboard focus and descriptive accessible names.
- Section targets account for the sticky landing navigation so headings are not hidden after scrolling.
- Event-category controls retain their current keyboard and focus behavior.
- Badges meet WCAG AA text contrast against their own opaque or sufficiently solid background.
- On narrow screens, explanatory panels stack and card badges wrap without covering important thumbnail content.
- Reduced-motion preferences continue to be respected for scrolling and existing gallery animation.

## Testing

Pure-function tests should cover:

- grouping mixed gallery data into the two customization levels;
- the fallback from missing or unknown values to `fully_customizable`;
- visible event categories being calculated independently for each level;
- omission of an empty level;
- gallery and best-seller mappings exposing the stored level.
- the landing organizer picker offering only models matching its customization group;
- duplicate placement being prevented across the two groups.

API tests, where the project has an existing suitable pattern, should verify rejection of unsupported customization values. Otherwise this validation is covered through the model-update helper tests.

Manual responsive checks should verify:

- both levels present;
- only one level present;
- each event filter acting only on its own section;
- badges appearing only on pre-designed gallery and best-seller cards;
- independent admin curation of both landing gallery groups;
- desktop preview behavior remaining unchanged;
- mobile card navigation remaining unchanged;
- Portuguese, English, and Spanish copy at common phone widths;
- keyboard navigation and reduced motion.

Run the focused Vitest tests, `npm run lint`, and `npm run build`. The build command must be used rather than invoking `next build` directly so Prisma generation and migrations run first.

## Acceptance criteria

- A visitor can define the difference between the two levels without opening a model.
- Gallery models are visibly separated into fully customizable and pre-designed sections.
- Pre-designed gallery and best-seller cards carry a persistent badge; fully customizable cards remain unbadged.
- Event-type browsing remains available within each gallery section.
- Existing unclassified models appear as fully customizable.
- Administrators can set exactly one of the two levels per invitation or save-the-date.
- Administrators independently choose which matching models appear in each landing gallery section.
- A pre-designed model does not appear publicly merely because it is classified as pre-designed.
- The same model has the same level everywhere it appears.
- Guest-name personalization is not confused with structural customization.
- All supported locales communicate equivalent meanings.

## Out of scope

- A third or intermediate customization tier
- A customer-facing invitation editor
- Changes to pricing based on customization level
- Changes to guest-name personalization fees or behavior
- Changes to invitation rendering or which structural edits the admin tools support
