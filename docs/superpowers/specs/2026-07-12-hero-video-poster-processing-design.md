# Hero Video Poster Processing Design

## Goal

Make every newly uploaded hero video produce and persist a first-frame poster, then keep that poster visible until the corresponding video paints a real frame. Poster generation is mandatory: a hero video upload must fail rather than save without a poster.

The behavior applies to standard invitation heroes, rich external-link heroes, curtain/Canva heroes, video-entrance heroes, and full-screen external-video invitations.

## Existing System

`MediaUpload` uploads media directly to S3 through a presigned URL. For videos, it then calls `POST /api/admin/media/process-video`. The processor downloads the S3 object, optionally normalizes it to H.264 MP4, extracts frame zero as a JPEG, uploads derived assets, and returns `url` plus an optional `posterUrl`.

Invitations already store the two assets separately as `videoUrl` and `videoPoster`, so this change does not require a Prisma migration. Admin forms already attempt to persist both values.

The current gaps are:

- Video processing is best-effort, so `MediaUpload` accepts a video when processing fails or no poster is returned.
- Admin inputs allow up to 500 MB in some hero flows, while presigning and processing are limited to 100 MB.
- The standard hero and full-screen external-video renderer do not display `videoPoster` as an explicit image layer.
- Some renderers rely only on the native `<video poster>` attribute, which can expose a black frame during the transition to playback on mobile browsers.
- Manual video URL entry bypasses processing and cannot guarantee a poster.

## Chosen Approach

Use strict synchronous server-side processing after the direct S3 upload. Browser-side frame extraction is rejected because it depends on browser codec support and is unreliable for common HEVC/MOV phone recordings. Asynchronous jobs are unnecessary for the current scope and would add job state, polling, and database lifecycle complexity.

## Upload and Processing Flow

1. The admin selects a hero video.
2. `MediaUpload` validates the client-side size limit and requests a presigned S3 upload URL using a `hero-video` upload profile.
3. The browser uploads the source directly to S3 with progress reporting.
4. `MediaUpload` enters a processing state and calls the protected Node.js processor with the uploaded S3 URL and the matching upload profile.
5. The processor validates that the URL belongs to the configured bucket and that the object does not exceed the profile's server-side limit.
6. The processor streams the S3 object to a temporary file. It normalizes the video to a web-safe H.264 MP4 when required and extracts frame zero as a JPEG capped at 1280 pixels wide.
7. The processor uploads the final video when transcoding produced a new file and uploads the JPEG poster alongside it.
8. The processor returns success only when it has both a final video URL and a poster URL.
9. `MediaUpload` validates the response and invokes `onUpload(finalVideoUrl, { posterUrl })` only after full success.
10. The admin form updates `videoUrl` and `videoPoster` together.

The existing `videoUrl` and `videoPoster` fields remain the storage contract. Older invitations with a video and no poster remain readable; the mandatory invariant applies to new uploads and replacements.

## Upload Limits

Add a shared `hero-video` profile with a 500 MB maximum. The presign endpoint and video processor must both resolve the limit through the same upload-limit helper, preventing the UI and server from drifting apart.

The processor must stream downloads to disk and pass file paths to ffmpeg. It must not load the source video into a single in-memory buffer. A transcoded output may still need uploading from disk; the implementation should use a file-stream upload path for large derived videos rather than `readFile` into memory.

Cover-sequence videos may continue using their existing smaller UI limit, but they can use the same strict poster requirement and processing contract.

## Failure Semantics

The upload fails when any of the following occurs:

- Presigning or the S3 upload fails.
- The object is not in the configured S3 bucket.
- The object exceeds the server-side profile limit.
- Codec inspection or required transcoding fails.
- First-frame extraction fails.
- Uploading a derived asset fails.
- The processor returns a non-success status.
- The processor response is missing either the final video URL or poster URL.

On failure, `MediaUpload` shows an actionable error state and does not call `onUpload`. Existing form values therefore remain unchanged. The server performs best-effort cleanup of source and derived objects created by the failed attempt when it can identify them safely. Cleanup errors are logged but do not replace the processing error shown to the admin.

Manual URL entry is disabled for `kind="video"`. Processing arbitrary external URLs would create an SSRF surface and cannot guarantee that the server can read or decode the asset. Images, SVGs, and audio retain their existing URL-entry behavior.

## Rendering and Loading Contract

Every hero video renderer receives both `videoUrl` and `videoPoster`. It applies the poster in two ways:

- Set the native `<video poster={videoPoster}>` attribute as a browser fallback.
- Render the poster as an explicit, full-size image layer above the video.

The explicit poster layer uses the same resolved `object-fit` as the video and the same positioning container. It remains fully opaque until the browser confirms that the video has painted a decoded frame. The preferred signal is `requestVideoFrameCallback`; playback/time-progress events provide the compatibility fallback. Once a frame is confirmed, the poster fades out over approximately 200 milliseconds.

The layer must not disappear merely because metadata, `canplay`, or `playing` fires; those events can precede visible frame presentation on mobile browsers. A failed or stalled video leaves the poster visible rather than exposing a black background.

This contract applies to:

- Standard invitation and rich external-link heroes, including the persistent prefetched video element adopted by `PrefetchedVideoSlot`.
- Curtain/Canva background heroes.
- Video-entrance cover/hero playback.
- Full-screen external-video invitations.

Existing invitations without `videoPoster` fall back to the renderer's theme or black background without crashing.

## Component Boundaries

The implementation should centralize poster visibility behavior in a small reusable client-side unit rather than duplicating event logic in every renderer. The unit's responsibilities are:

- Track whether a real frame has been presented.
- Register and clean up frame callbacks and fallback listeners.
- Expose the poster's visible/hidden state.
- Render or support rendering the overlay with the requested fit and fade.

`PrefetchedVideoSlot` remains responsible for adopting and styling the already-buffered DOM video element. It additionally participates in the shared painted-frame contract and renders the poster overlay within its container.

The processor remains responsible only for media normalization, poster generation, S3 persistence, cleanup, and its response. Admin forms remain responsible for storing the returned pair of URLs.

## Testing

Implementation follows test-driven development. Focused tests will cover:

- The `hero-video` profile resolves to 500 MB and existing profiles retain their limits.
- Strict processor-response validation rejects missing `url`, missing `posterUrl`, and non-success responses.
- A valid processed response produces the `{ url, posterUrl }` pair consumed by admin forms.
- Processing rejects objects above the selected profile limit.
- Poster extraction or transcoding failure produces an error instead of a successful video-only response.
- The poster visibility state remains visible before a painted frame, hides after a painted frame, and remains visible on video failure.
- Hero renderers pass the stored poster to both the video element and overlay path.
- Clearing or replacing a hero video keeps `videoUrl` and `videoPoster` synchronized.

Verification will run focused Vitest tests first, followed by the full `npm test` suite, `npm run lint`, and `npm run build`. The build command must be used rather than invoking `next build` directly because it refreshes the generated Prisma client and applies migrations first.

## Out of Scope

- Database schema changes or combining the two URLs into a JSON object.
- User-selectable poster frames or poster cropping.
- Background job infrastructure and processing progress polling.
- Backfilling posters for existing invitations.
- Fetching or processing arbitrary external video URLs.
