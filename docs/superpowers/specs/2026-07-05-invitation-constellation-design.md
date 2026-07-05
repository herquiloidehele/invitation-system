# Invitation Constellation Landing Section

## Goal

Add a new landing-page section that complements the existing detailed feature
showcase with a complete, memorable overview of the capabilities available in
an invitation. The section should make the product feel cohesive rather than
presenting another software-style card grid.

The new section appears after `FeaturesSection` and before `LiveDemoSection`.
It does not replace or alter the existing feature showcase.

## Design Direction

The section depicts a stylized digital invitation at the center of a
constellation. Four named feature groups sit around it on structured arcs,
connected to the invitation with fine lines. This visual expresses that the
features are parts of one invitation rather than a bundle of unrelated tools.

The signature element is the constellation itself: a central invitation with
feature pills arranged into two visually balanced sides. Guest-facing
capabilities sit predominantly on one side and couple-facing management tools
on the other.

The section uses the landing page's existing Outfit typography and semantic
color tokens. The central invitation uses `--primary-deep`, feature pills use
`--card`, connecting lines use `--border`, and the section background uses
`--muted`. No new font or independent color system is introduced.

## Content

The section heading is localized through `next-intl`.

- Eyebrow: “Everything included”
- Title: “One invitation. Everything beautifully connected.”
- Supporting copy: “From the first tap to the final guest count, every detail
  lives in one thoughtful experience.”

The audited capabilities are grouped by customer outcome:

### Make an entrance

- Animated envelope or video entrance
- Background music
- Custom design, typography, and text
- Personalized social-sharing preview

### Tell your story

- Countdown and save-the-date presentation
- Event schedule
- Couple story
- Photo gallery
- Dress code

### Guide every guest

- Maps and multiple locations
- Add to calendar
- Gift registry
- Guest guide and local recommendations
- Frequently asked questions
- Multiple languages

### Stay organized

- Personalized RSVP
- Companion and party-size responses
- Dietary notes
- Custom questions and guest messages
- Guest tracking and owner guest management
- WhatsApp sharing
- Excel export

The labels should describe outcomes in plain language. They must not expose
internal model names or imply capabilities that are absent from the current
product.

## Desktop Layout

The section uses the landing page's existing `max-w-7xl` content width and
section spacing. The heading is centered above a large constellation stage.

The stage has a fixed visual center but scales fluidly with its container:

1. A decorative invitation mockup occupies the center.
2. Two subtle elliptical guide lines establish the orbit.
3. Four category labels anchor the quadrants.
4. Feature pills cluster along the arcs nearest their category.
5. Fine connector lines visually return each cluster to the central
   invitation.

All capability labels remain visible at once on wide screens. The design does
not use a carousel, disclosure, or auto-rotating content.

The invitation mockup is decorative and built with HTML/CSS rather than an
image. It contains a monogram, sample couple names, and a date so it remains
crisp and inherits the landing palette.

## Responsive Layout

Below the desktop breakpoint, the orbital stage becomes a vertical
constellation:

- The invitation mockup appears first and remains centered.
- A thin vertical line runs down from the invitation.
- The four feature groups alternate slightly left and right along the line.
- Each group contains a compact, wrapping set of feature pills.
- All content remains visible without horizontal scrolling.

On narrow phones, the alternating offset is reduced so labels have sufficient
width. Text must not shrink below the landing page's normal small-body size.

## Interaction and Motion

Motion is restrained and supports the connected-system idea:

- When the section enters the viewport, the central invitation appears first,
  the orbit lines draw in, and feature groups reveal in a short stagger.
- Hovering or focusing a feature pill emphasizes its category connector and
  gives the central invitation a subtle highlight.
- The feature groups may drift by a few pixels in response to scroll progress.
- Nothing continuously rotates or moves after the reveal.
- With reduced motion enabled, all elements render in their final positions
  with no drawing, drift, or stagger animation.

Feature pills are informational, not links or buttons. Hover styling must not
suggest that clicking them performs an action.

## Component Structure

Create a dedicated `InvitationConstellationSection` client component under
`components/landing/`. Keep static feature definitions in the component unless
they are needed elsewhere. Each localized label is read from a new
`LandingConstellation` message namespace.

Recommended internal units:

- `InvitationConstellationSection`: section shell, heading, and responsive
  stage.
- `InvitationMockup`: decorative center object.
- `FeatureCluster`: category label, icon, and feature pills.
- `ConstellationLines`: decorative desktop orbit and mobile spine.

The component should reuse `AnimatedSection`, `SectionEyebrow`, and the existing
landing motion helpers where their behavior fits. It should not add a new
animation library.

Add the section to `BrindealHomepage` between `FeaturesSection` and
`LiveDemoSection`.

## Accessibility

- The decorative invitation and connector lines are hidden from assistive
  technology.
- The four feature groups use semantic headings and lists.
- Informational pills are non-interactive list items.
- Any hover emphasis is also available through `:focus-within` if a future
  interactive element is introduced.
- Color is not the only signal that associates a feature with its group.
- The layout must respect `prefers-reduced-motion`.

## Localization

Add complete `LandingConstellation` entries to `messages/pt.json`,
`messages/en.json`, and `messages/es.json`. Portuguese remains the source
language, with natural translations rather than literal word-for-word copy.

Feature data should use stable translation keys so the same component structure
renders every locale.

## Verification

- Add or update a pure-data test to verify that all four groups render from the
  expected translation keys and that no capability is omitted.
- Run the relevant Vitest test directly.
- Run `npm run lint`.
- Run `npm run build`, never `next build` directly.
- Visually inspect desktop and mobile widths in all three locales.
- Verify the reveal and hover treatment with normal motion and reduced motion.
- Confirm the section sits between the existing feature showcase and live demo.

## Out of Scope

- Replacing the existing feature showcase.
- Making individual features clickable.
- Adding pricing or plan comparisons.
- Loading feature content from the database or admin.
- Changing which capabilities the product supports.
