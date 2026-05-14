# Mux video migration — backfill handoff

**Status:** Phase 1 complete. Phase 2 + 3 not started.
**Owner before:** Nacho. **Owner now:** Mariana.

## Phase 1 (done) — Upload Sanity videos to Mux

Script: `scripts/migrate-videos-to-mux-upload.ts`
Output: `migration-progress.json` (at repo root, not committed)

- **124/124** referenced video assets uploaded to Mux, status `ready`, 0 errored.
- Mux quality: **basic** (free encoding tier — can be upgraded later by re-creating
  assets at `plus`; the progress file has the `sanityAssetId → muxAssetId` map needed
  for that).
- Script writes only to Mux + the local progress file. Zero Sanity writes.
- Idempotent (re-running skips `ready` entries).

### Scope decisions (locked)

- **Filter:** only `sanity.fileAsset` videos referenced by `project`, `post`, or
  `homepage` documents. GROQ filter in the script.
- **Excluded:** `threeDAssets.videos[]` and `threeDAssets.arcade.idleScreen` — those
  feed WebGL `useVideoTexture` and were out of scope per design decision. 7 small
  clips (`crt-arcade.mp4`, `cursor.mp4`, `dl.mp4`, `logo.mp4`, `alltv9low.mp4`,
  `designermac-2.mp4`, `patasojo.mp4`) are the threeDAssets-only ones excluded by
  this filter.
- **Out of `sanity.fileAsset` entirely:** `post.heroVideo` is a `type: "url"` field
  (external URL string, not file upload), so it's not in the backfill set. Your
  PR's new `muxHeroVideo` field is uploads-going-forward only.

### Env vars used (`.env.local`)

```
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET
SANITY_API_TOKEN
MUX_TOKEN_ID
MUX_TOKEN_SECRET
```

## Phase 2 (TODO) — Create `mux.videoAsset` docs in Sanity

For each entry in `migration-progress.json`, create a `mux.videoAsset` document
that mimics what `sanity-plugin-mux-input` produces when you upload via Studio.

**What we need to nail down first:** the exact doc shape your plugin creates,
especially:
- `_id` format (does the plugin use a deterministic ID, e.g. derived from the
  playback ID, or a random UUID?)
- Required vs optional fields (`data`, `thumbTime`, `uploadId`, etc.)
- Whether `data` needs the full Mux asset payload or just selected fields

Easiest way to settle this: once PR #401 is merged, upload one test video via
Studio, then `sanity documents get <id> --pretty` on the resulting
`mux.videoAsset` doc. Use that shape verbatim in the phase 2 script.

The progress file has everything needed (`muxAssetId`, `muxPlaybackId`,
`duration`, `aspectRatio`, `filename`, `size`).

## Phase 3 (TODO) — Set new sibling fields on referencing docs

Per your PR #401 schema, write to:

| Old field (deprecated) | New field to write |
|---|---|
| `project.coverVideo` | `project.muxCoverVideo` |
| `project.showcase[].video` | `project.showcase[].muxVideo` |
| `homepage.featuredProjects[].coverVideo` | `homepage.featuredProjects[].muxCoverVideo` |
| `post.content[videoEmbed].file` | `post.content[videoEmbed].muxVideo` |

Field value shape (Mux plugin's reference type):
```ts
{
  _type: 'mux.video',
  asset: { _type: 'reference', _ref: '<mux.videoAsset doc _id from phase 2>' }
}
```

For portable-text-embedded `videoEmbed` blocks: target by block `_key` for safe
patching. For showcase array items: same — use `_key` if present.

**Don't touch the legacy field.** PR #401 keeps them with `deprecated: { ... }`
and the frontend falls back to them if `muxVideo` is unset — the rollback plan.

## Critical sequencing — cache + rate limit

We hit ~98GB/100GB Sanity bandwidth in 3 days. Merging PR #401 invalidates the
build cache and re-fetches everything, which would blow past the limit.

**Recommended order to avoid the spike:**

1. Run phase 2 + 3 against production data **with PR #401 still open** (Sanity
   is schemaless at the data layer — the `mux.video` references write fine even
   though no live schema declares the field; old code ignores them).
2. Then merge PR #401. The frontend immediately reads from Mux because the data
   is already populated. The cache rebuild after deploy fetches *less* from
   Sanity than before because video bytes no longer flow through Sanity.

If anything in phase 2 or 3 fails mid-run, the legacy fields are untouched —
zero user-visible impact, just re-run.

## Reference

- Phase 1 script: `scripts/migrate-videos-to-mux-upload.ts`
- Progress / mapping: `migration-progress.json` (124 entries, at repo root)
- Script deps (install if re-running phase 1; not committed): `@mux/mux-node`,
  `@sanity/client`, `dotenv`
- Schema PR: #401
- Bandwidth issue context: top consumers were ~20 MP4s (109/95/77 MB); full
  reference set turned out to be 124 videos / 1.42 GB.
