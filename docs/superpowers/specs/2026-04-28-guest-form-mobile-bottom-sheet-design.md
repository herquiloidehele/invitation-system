# Guest Form Mobile Bottom Sheet Design

**Date:** 2026-04-28
**Status:** Approved
**Scope:** Change the add/edit guest form so it opens as a bottom sheet on mobile while preserving the current right-side sheet behavior on `sm` and larger screens.

---

## Context

`components/admin/GuestForm.tsx` already uses the shared `Sheet` primitive for both add and edit flows. Today it always behaves like a right-side panel, which works well on larger screens but feels heavy on phones where a bottom-anchored sheet is easier to reach and scan.

The request is a presentation change only. The form fields, validation, submit flow, and owner/admin guest-management APIs remain unchanged.

---

## Decision

Keep a single `GuestForm` implementation and make the sheet presentation responsive:

- below `sm`: render as a bottom sheet
- from `sm` upward: keep the current right-side sheet

This keeps the logic in one place and avoids introducing separate mobile and desktop form variants.

---

## Design

### Component behavior

`GuestForm` will continue to own the entire add/edit guest form. The only change is the shell used by `SheetContent`:

- mobile uses `side="bottom"`
- tablet/desktop uses `side="right"`

If the current shared `Sheet` component does not support responsive side changes cleanly, extend it in the smallest way needed so `GuestForm` can switch presentation without duplicating form markup.

### Mobile bottom-sheet requirements

On screens below `sm`, the form should:

- open from the bottom edge
- use rounded top corners and no desktop-style side-panel feel
- cap its height to the viewport and scroll internally for long content
- keep the primary actions easy to reach
- preserve backdrop-dismiss and explicit cancel/close behavior

The footer actions remain part of the sheet, with the same labels and submit wiring used today.

### Desktop behavior

From `sm` upward, keep the current behavior unchanged:

- right-side sheet
- current width constraints
- current form layout and footer actions

### Scope boundaries

This change does not include:

- changing the guest form fields
- changing add/edit logic
- changing delete confirmation behavior
- changing public invite modals such as `InviteOthersModal`

---

## Implementation Notes

- Primary file: `components/admin/GuestForm.tsx`
- Likely supporting file: `components/ui/sheet.tsx` only if the shared primitive needs a small responsive extension
- `GuestListEditor` should not need behavior changes beyond continuing to open `GuestForm` for add/edit actions

The preferred implementation is the smallest local change that preserves the existing shared sheet API unless a tiny extension to `SheetContent` makes the responsive behavior cleaner.

---

## Verification

Manual verification:

1. On a mobile viewport, opening add/edit guest shows a bottom sheet.
2. On a mobile viewport, long content scrolls inside the sheet rather than the page behind it.
3. On a mobile viewport, cancel, close, validation, and save still work.
4. On a desktop viewport, the guest form still opens as the current right-side sheet.
5. Add and edit flows behave the same in both owner and admin guest-management surfaces.

Automated verification:

- run `npx tsc --noEmit`
- add or update targeted tests only if the implementation introduces new logic that is practical to cover in the current test setup

---

## Notes

This spec intentionally keeps the change narrow. It is a responsive UX adjustment for the guest-management form, not a broader modal-system redesign.
