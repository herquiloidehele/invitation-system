# Instagram Landing Browser Handoff Design

## Goal

When the localized marketing landing page is opened inside Instagram's in-app
browser on Android or iOS, guide the visitor into a full browser. The behavior
must not affect invitations, RSVP flows, login, admin pages, or landing-page
preview iframes.

## Scope

The handoff component is rendered only by `app/[locale]/page.tsx`. It therefore
applies to localized landing routes such as `/pt` and `/en`, while sibling
routes such as `/[locale]/[slug]` remain unchanged.

## Design

Add a small client component dedicated to the landing page and pure utilities
for:

- detecting Instagram from the browser user agent;
- distinguishing iOS from Android;
- constructing an Android browser-intent URL without losing the current path,
  query string, or fragment.

After hydration, the component exits without rendering unless it is in the
top-level browsing context and the user agent identifies Instagram.

For Android, the primary action uses an Android browser intent. For iOS, where
a website cannot reliably force an automatic Safari handoff, the component
shows a blocking instruction panel with an action based on the existing
scheduling-app implementation. The panel also explains Instagram's manual
"Open in browser" menu and offers a copy-link fallback. If a programmatic
handoff fails, the instructions remain available.

The handoff is initiated by a user action rather than during render. This
avoids browser popup restrictions and unexpected redirect loops.

## User Experience

The visitor sees a focused Portuguese prompt explaining that the page works
best in the device browser. The panel provides:

1. A prominent "Abrir no navegador" action.
2. Short instructions for Instagram's menu when automatic handoff is blocked.
3. A "Copiar link" fallback with confirmation.

The landing page is not offered as a "continue here" path because the intended
behavior is to move Instagram visitors to a full browser.

## Failure Handling

- Unsupported or changed Instagram user agents fail open and show the normal
  landing page.
- Failed external-browser handoffs leave the instruction panel visible.
- Clipboard failures do not dismiss the panel and show no false success state.
- Embedded phone-preview iframes do not trigger the panel.

## Testing

Vitest unit tests cover user-agent detection and Android intent URL
construction, including query strings and fragments. Type checking and linting
verify the component integration. Browser handoff behavior still requires a
real-device smoke test in current Instagram versions on iOS and Android because
desktop emulation cannot reproduce native app URL handling.
