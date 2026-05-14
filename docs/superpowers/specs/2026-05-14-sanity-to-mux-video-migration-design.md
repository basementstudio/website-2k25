# Sanity → Mux Video Migration — Design

**Date:** 2026-05-14
**Status:** Approved, ready for implementation plan
**Driver:** Cost / bandwidth — offload video egress from the Sanity CDN to Mux.

## Goals

- Move all production video traffic from Sanity-served `file` assets to Mux-served HLS playback.
- Adopt the standard Sanity + Mux editor workflow (`sanity-plugin-mux-input`) so future uploads go to Mux natively.
- Provide a safe, rollback-friendly path: existing video data stays valid in Sanity until a follow-up cleanup pass.

## Non-goals

- Migrating `threeDAssets.videos[]`. Those are likely 3D texture inputs (`VideoTexture`) and require raw mp4 frames, not HLS.
- Writing the backfill migration script. A coworker owns that workstream.
- Mux Data analytics dashboards. The env hook is left optional; configuration is deferred.
- Signed playback IDs. Marketing-site content is public.

## Approach Summary

- **Soft cutover.** Add new Mux fields as siblings of existing video fields. Keep existing fields and data untouched, marked `deprecated`. Frontend prefers Mux when present, falls back to the legacy field. After a grace period, a follow-up PR removes the legacy fields and the orphaned Sanity assets.
- **No field renames.** Existing documents stay valid. The deprecation flag surfaces a Studio warning without invalidating data or breaking queries.
- **Studio plugin handles uploads.** `sanity-plugin-mux-input` provides direct browser-to-Mux uploads with progress and previews. The backfill script (out of scope here) produces the same `mux.videoAsset` document shape, so studio uploads and backfilled assets are structurally identical.

## 1. Schema changes

Each video-bearing schema gets a new sibling `mux.video` field. The existing field stays at its current path and name, marked deprecated.

| Schema | Existing field (kept, marked `deprecated`) | New sibling field |
|---|---|---|
| `sanity/schemas/objects/videoEmbed.ts` | `file: file` (mp4) | `muxVideo: mux.video` |
| `sanity/schemas/objects/showcaseItem.ts` | `video: file` (mp4/webm) | `muxVideo: mux.video` |
| `sanity/schemas/singletons/homepage.ts` `featuredProjects[].coverVideo` | `coverVideo: file` | `muxCoverVideo: mux.video` |
| `sanity/schemas/documents/project.ts` | `coverVideo: file` | `muxCoverVideo: mux.video` |
| `sanity/schemas/documents/post.ts` | `heroVideo: url` (currently unused on frontend) | `muxHeroVideo: mux.video` |
| `sanity/schemas/singletons/threeDAssets.ts` `videos[]` | unchanged | — (out of scope) |

Naming convention: new field is the old name prefixed with `mux`. Predictable and greppable.

Each deprecated field gets:

```ts
deprecated: {
  reason: 'Migrating to Mux. Use the "mux*" sibling field for new uploads.',
}
```

Editors see a deprecation warning on the old field; the new Mux field appears directly below it.

### Studio plugin

- Install `sanity-plugin-mux-input`.
- Register the plugin in the Studio config (`sanity.config.ts` / equivalent).
- Mux credentials are configured through the plugin's in-Studio UI on first use; they are stored as a `mux.apiKey` document in the dataset. No `MUX_TOKEN_*` environment variables are required for this scope.

## 2. GROQ + types

Add a second fragment alongside the existing one. Every call site projects both the legacy field and the new Mux field.

```ts
// src/service/sanity/queries.ts
export const videoFragment = `{
  "url": asset->url,
  "mimeType": asset->mimeType
}`

export const muxVideoFragment = `{
  "playbackId": asset->playbackId,
  "assetId": asset->assetId,
  "aspectRatio": asset->data.aspect_ratio,
  "duration": asset->data.duration
}`
```

Usage examples:

```groq
// homepage featuredProjects + project
coverVideo ${videoFragment},
muxCoverVideo ${muxVideoFragment}

// showcase
video ${videoFragment},
muxVideo ${muxVideoFragment}

// post videoEmbed block
"videoUrl": file.asset->url,
muxVideo ${muxVideoFragment}

// post hero
heroVideo,                              // existing url string
muxHeroVideo ${muxVideoFragment}
```

### Types

Add to `src/service/sanity/types.ts`:

```ts
export type SanityVideo = { url: string | null; mimeType: string | null }

export type SanityMuxVideo = {
  playbackId: string | null
  assetId: string | null
  aspectRatio: string | null   // e.g. "16:9"
  duration: number | null
}
```

Each consuming type holds both fields:

```ts
type FeaturedProject = {
  // ...
  coverVideo: SanityVideo | null
  muxCoverVideo: SanityMuxVideo | null
}
```

## 3. Frontend rendering

### Resolver helper

A single helper normalizes the "Mux if present, legacy otherwise" decision. New file: `src/lib/video/resolve-source.ts`.

```ts
type ResolvedVideo =
  | { type: 'mux'; playbackId: string; aspectRatio: string | null }
  | { type: 'legacy'; url: string; mimeType: string | null }
  | null

export function resolveVideoSource(input: {
  mux?: SanityMuxVideo | null
  legacy?: SanityVideo | null
}): ResolvedVideo {
  if (input.mux?.playbackId) {
    return { type: 'mux', playbackId: input.mux.playbackId, aspectRatio: input.mux.aspectRatio }
  }
  if (input.legacy?.url) {
    return { type: 'legacy', url: input.legacy.url, mimeType: input.legacy.mimeType }
  }
  return null
}
```

For the `post.heroVideo` case where the legacy field is a `url` string (not a file asset), the resolver accepts a string and adapts:

```ts
export function resolveHeroVideo(input: {
  mux?: SanityMuxVideo | null
  legacyUrl?: string | null
}): ResolvedVideo { /* same shape, legacy.mimeType = null */ }
```

### Component changes

**`src/components/primitives/video.tsx`** — currently passes raw Sanity URLs into `MuxVideo`, which is incorrect (it sets `streamType="on-demand"` but never receives a playback ID). Update the component:

- Accept either `{ playbackId: string }` or `{ src: string; mimeType?: string }` (discriminated union).
- When `playbackId`, render `<MuxVideo playbackId={...} streamType="on-demand" ...rest />`.
- When `src`, render a native `<video><source src={src} type={mimeType} /></video>` so we don't pretend a non-HLS URL is HLS.
- Used by showcase list, showcase gallery, image-with-video-overlay.

**`src/components/primitives/image-with-video-overlay.tsx`** — update `VideoFragment` type to accept both `SanityVideo` and `SanityMuxVideo` inputs and pass resolved source into `Video`.

**`src/app/(site)/(pages)/post/[slug]/content.tsx`** (line 344) — the `videoEmbed` block currently renders a native `<video controls>`. Update:

- If `muxVideo.playbackId` is present, render `<MuxPlayer playbackId={...} />` from `@mux/mux-player-react`.
- Otherwise, fall back to the existing native `<video><source /></video>` pattern.

**Post hero rendering** — currently `heroImage` only. Update three sites so that when `muxHeroVideo.playbackId` is present, the hero renders an autoplay/muted/looping `MuxVideo` instead of the image:

- `src/app/(site)/(pages)/post/[slug]/page.tsx`
- `src/app/(site)/(pages)/post/[slug]/more.tsx`
- `src/app/(site)/(pages)/blog/featured.tsx`

The `heroImage` remains the poster/fallback when no video is present.

### Player package split

- `@mux/mux-video-react` (already installed): bare element for autoplay/muted/loop surfaces — showcase list, showcase gallery, hover overlay, post hero.
- `@mux/mux-player-react` (new dep): full player UI for the post `videoEmbed` block, where users actually press play and benefit from controls, captions, fullscreen, and keyboard handling. Bundle cost only lands on post pages.

## 4. Backfill (out of scope, noted for awareness)

A coworker will write a one-shot script that:

1. Queries every document with a non-null legacy video field.
2. Calls Mux `assets.create({ input: [{ url: sanityCdnUrl }] })` so Mux pulls directly from Sanity's CDN.
3. Polls until `status === 'ready'`.
4. Creates the corresponding `mux.videoAsset` document in Sanity (the shape `sanity-plugin-mux-input` produces).
5. Patches the source document, setting the new `mux*` field to reference the asset.
6. Leaves the legacy field intact for grace-period rollback.

Our schema and frontend changes are designed so that this script can run at any time after PR 1 lands and content gradually shifts from "legacy only" to "Mux + legacy" to "Mux only".

## 5. Dependencies and environment

### New deps

- `sanity-plugin-mux-input` — Studio plugin.
- `@mux/mux-player-react` — client, post `videoEmbed` block.

### Kept deps

- `@mux/mux-video-react` — already installed; continues to be used for autoplay loops.

### Dropped from this scope

- `@mux/mux-node` — needed only by the backfill script.

### Environment variables

- `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` — **not required** for this scope. Plugin handles credentials through Studio UI; the backfill script (separate scope) will define and consume its own env vars.
- `NEXT_PUBLIC_MUX_ENV_KEY` — optional, only if Mux Data analytics is added later. Not needed to ship.

## 6. Rollout plan

1. **PR 1 — Schema + Studio.** Add `muxVideo` / `muxCoverVideo` / `muxHeroVideo` fields. Mark legacy fields `deprecated`. Install and register `sanity-plugin-mux-input`. Deploy. From this point editors can upload videos to Mux from Studio.
2. **PR 2 — Frontend.** Add `muxVideoFragment` and update every GROQ query to project both fields. Add `resolveVideoSource` helper. Update `Video` primitive, `image-with-video-overlay`, post `videoEmbed`, and post hero rendering (three files). Frontend prefers Mux, falls back to legacy. Deploy.
3. **Backfill.** Coworker runs migration script against production dataset. Existing videos are now resolvable via either field.
4. **Verification.** Hold for one release cycle. Confirm Sanity video egress drops and Mux delivery is healthy on every surface.
5. **PR 3 — Cleanup (separate scope, post-grace-period).** Remove legacy fields from schemas. Drop fallback paths from frontend components. A follow-up script deletes orphaned Sanity file assets.

## 7. Risks & mitigations

- **Plugin credentials get committed by accident.** Mitigation: `sanity-plugin-mux-input` stores credentials as a private `mux.apiKey` document in the dataset, not in source. No `.env` action needed.
- **Aspect ratio drift.** Mux returns aspect ratio as a `"W:H"` string; the legacy `<video>` element infers from the file. Components that rely on a numeric aspect ratio must parse the Mux string. Mitigation: parse in the resolver helper and expose a numeric `aspectRatioNumber` if needed.
- **Editors keep uploading to the legacy field.** Mitigation: `deprecated` flag surfaces a warning. Internal comms during PR 1 rollout.
- **Backfill timing.** PRs 1 and 2 can ship before the backfill runs; the frontend simply continues falling back to the legacy field until the new field is populated. Order between PR 2 and the script is flexible.

## 8. Acceptance criteria

- Studio shows the new `mux*` field beside each video field, and the legacy field renders with a deprecation warning.
- A new video uploaded through the Studio plugin renders correctly on the matching frontend surface, served by Mux.
- A document with only the legacy field populated continues to render correctly, served by Sanity.
- A document with both fields populated renders the Mux source.
- Post pages render `muxHeroVideo` in place of `heroImage` when present; otherwise the existing image renders unchanged.
- The post `videoEmbed` block renders `@mux/mux-player-react` when `muxVideo` is set, with controls and captions working.
- All existing GROQ queries still parse and return data for documents that have not been migrated.
