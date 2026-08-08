# Hero Video Default Audio

## Goal

Allow an administrator to choose whether an invitation's hero video starts muted. Existing invitations and newly created invitations remain muted unless an administrator explicitly enables sound.

## Scope

The setting controls the video stored in `Invitation.videoUrl` everywhere that video is used as the hero:

- standard invitations;
- generic external-video invitations;
- video-entrance invitations;
- the looping hero background revealed by curtain-canva invitations;
- admin previews that use those renderers.

It does not control the separate curtain animation (`curtainVideoUrl`) or cover video sequence (`coverVideos`). Those videos retain their current audio behavior.

## Data Model

Add `heroVideoMuted Boolean @default(true)` to `Invitation`. The corresponding `InvitationData` field is optional so older serialized or fixture data continues to work; renderers resolve a missing value as muted.

The value must round-trip through:

- invitation creation;
- invitation update;
- public invitation row mapping;
- admin edit-form hydration;
- invitation duplication;
- seed create and update operations.

The database default and application fallback both preserve the current muted behavior.

## Admin Experience

Show a switch alongside each admin hero-video uploader. Its Portuguese label is `Vídeo sem som`, and supporting text explains that disabling it starts the hero video with sound where the browser permits playback.

The switch is checked when `heroVideoMuted` is missing or true. It updates the form value directly and remains visible only in a context where the hero-video setting is available.

## Playback Behavior

Every renderer of `Invitation.videoUrl` binds the video element's `muted` state to `invitation.heroVideoMuted !== false`.

The application does not silently change an administrator's unmuted selection back to muted. Browsers commonly reject unmuted autoplay; layouts that begin after a guest gesture can play with sound, while autoplaying layouts may require an existing interaction before playback succeeds. Existing playback error handling remains responsible for a rejected play request.

Prefetched hero-video elements must receive the same resolved muted value as directly rendered video elements so the setting does not change across the cover-to-hero transition.

## Testing

Add focused tests proving that:

- create data defaults or preserves the boolean correctly;
- admin hydration and public row mapping round-trip false;
- duplication includes the field;
- the admin form renders and updates the switch;
- all hero-video renderers use the resolved setting, including prefetched and curtain-canva paths;
- missing values resolve to muted for backward compatibility.

Run the focused Vitest files first, followed by the full test suite, lint, and the project build command.

## Out of Scope

- A guest-facing mute/unmute button.
- Separate audio defaults per layout.
- Changing background audio behavior.
- Changing curtain-animation or cover-video audio.
