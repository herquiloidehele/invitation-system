# Host Guest Form Mode

## Goal

Allow an administrator to choose how much information the host can enter when adding or editing guests from the confirmation page. Administrators always retain the complete guest form.

## User Experience

The invitation editor's **Gestão de Convidados** section will include a host form mode control with two choices:

- **Completo**: shows every guest field currently available to the host.
- **Mínimo**: shows only **Nome** (required) and **Mesa** (optional).

The default is **Completo** for both existing and new invitations, preserving current behavior. The control appears with the other host permissions, near **Permitir que o anfitrião adicione convidados**, in both the standard and external invitation editors.

The mode affects only the host-facing guest form on the confirmation page. Guest forms opened inside either admin invitation editor always show every applicable field, including the custom external link field where supported.

## Persistence and Types

Add a non-null invitation field for the host guest form mode. It stores a constrained string value:

- `complete`
- `minimal`

The database default is `complete`. Application normalization also falls back to `complete` whenever it receives an absent or unrecognized value. This protects existing records and keeps API behavior deterministic.

The field flows through the existing invitation create, update, admin-initial-data, and public invitation data boundaries in the same way as `ownerCanAddGuests`.

## Component Boundaries

`GuestForm` will accept an optional mode prop that defaults to `complete`. It remains responsible for rendering and submitting the fields appropriate to that mode.

`GuestListEditor` will accept and forward the same optional mode. Admin callers omit it and therefore receive the complete form. `GuestsTabClient`, the host-facing caller, receives the stored invitation mode from its server page and passes it into `GuestListEditor`.

A small pure utility will define the supported modes and normalize unknown input. Keeping normalization outside React makes the persistence boundary straightforward to test in the existing Node-based Vitest setup.

## Submission Semantics

In minimal mode, hidden inputs must not erase guest data that an administrator entered earlier.

- When creating a guest, hidden optional text fields submit empty values, `canInviteOthers` submits `false`, and the phone country code uses the existing default.
- When editing a guest, hidden fields retain the values loaded from that guest even though they are not rendered.
- Name and table remain editable and follow their existing validation rules.

The owner API continues to validate the complete payload shape. The UI supplies safe values for hidden fields, so no weaker API schema or special server-side branch is required.

## Error Handling and Compatibility

Unknown or missing mode values resolve to `complete`. Existing invitations therefore continue to expose the full host form after deployment.

The feature does not alter guest records, admin permissions, the ability to add guests, or guest-list display. It only controls which inputs the host can see and edit.

## Testing

Tests will cover:

- mode normalization, including the default and invalid values;
- invitation creation and admin data mapping preserving the mode;
- minimal-mode payload behavior for a new guest;
- minimal-mode editing preserving hidden guest values;
- complete mode remaining the default;
- owner-page propagation of the stored mode where it can be tested without adding a DOM test environment.

Verification will run the focused Vitest files, the full test suite, lint, and the repository's `npm run build` command.

## Out of Scope

- Individual per-field visibility checkboxes.
- Hiding fields from administrators.
- Changing which guest details appear in the guest list.
- Altering the RSVP form or public invitation fields.
