# 3D Config

Source of truth for everything the 3D canvas needs at runtime: asset URLs, mesh names, scene configs, inspectables.

## Where things live

| Data | Location | Edited by |
|---|---|---|
| Binary files (GLB, EXR, JPG, WebP, PNG, MP3, MP4) | `public/3d/<category>/<name>-<hash>.<ext>` | Hand-edited |
| Asset URLs + mesh name lists | [`asset-manifest.ts`](./asset-manifest.ts) | Hand-edited |
| Per-inspectable mesh / offsets / fx URL | [`inspectables-meta.ts`](./inspectables-meta.ts) | Hand-edited |
| The 10 map models | `public/3d/models/<name>-<hash>.glb` | Hand-edited |
| Map texture overrides | Sanity Studio → 3D Config → Map Assets | Editors in Studio |
| Inspectable title / specs / description (PortableText) | Sanity Studio → 3D Config → Inspectables | Editors in Studio |
| Scene camera / postprocessing / tab labels | Sanity Studio → 3D Config → Scenes | Editors in Studio |
| Physics tuning values | Sanity Studio → 3D Config → Physics | Editors in Studio |

On every request, [`fetch-assets-local.ts`](../../components/assets-provider/fetch-assets-local.ts) reads this directory and fetches the Sanity half, then joins them by inspectable `id` to produce the `AssetsResult` object that 25 downstream `useAssets()` consumers read. If a Sanity doc is missing, the affected inspectable renders with empty copy and logs a one-time warning.

## Map models are local

The ten map models — `office`, `officeItems`, `officeWireframe`, `outdoor`,
`outdoorCars`, `godrays`, `routingElements`, `basketball`, `basketballNet`,
`contactPhone` — live in `public/3d/models/` and are declared in
[`asset-manifest.ts`](./asset-manifest.ts).

`mapAssetsConfig` in Sanity still *has* fields for them, but
[`fetch-assets-local.ts`](../../components/assets-provider/fetch-assets-local.ts)
**deliberately does not read them.** The local copies are texture-optimised in a
way the Studio uploads are not (see below), and publishing them would mean
replacing production CMS assets. Everything else in `mapAssetsConfig` —
`mapTextures`, `meshOverrides` — is still honoured.

To hand model swaps back to Studio editors, read those fields again in
`fetchAssetsLocal` and prefer them over `ASSETS_BASE`. Be aware that a raw
Studio upload skips the optimisation below and will cost far more GPU memory.

**Mesh names are the contract.** Lightmap bakes, matcaps, inspectables and the
clickable navigation tabs all reference meshes inside these GLBs *by name*
(`SM_00_000`, `SM_MrBeast`, …). A re-export that renamed or restructured meshes
will load fine and then render wrong — untextured meshes, dead tabs, missing
inspectables. Nothing validates this.

### Optimising a map model

Raw exports carry PNG/JPEG/WebP textures, which must be fully decompressed in
GPU memory — a 1024² baseColor map costs 5.59 MB of VRAM (4 MB plus mips). KTX2
is ~8x cheaper. Before this pass, `officeItems` alone cost 78.6 MB of GPU memory
while `office`, which was already KTX2, cost 11.6 MB with *more* textures.

Three stages, in order:

```bash
# 1. gltf-transform cannot decode WebP, and silently skips those textures.
pnpm tsx scripts/3d-assets/glb-recode-webp.ts in.glb /tmp/s1.glb

# 2. ETC1S. Quality 255 is the max; measured visual impact on this scene was
#    a mean 0.3-2.0/255 pixel difference, i.e. within animation noise.
npx @gltf-transform/cli etc1s /tmp/s1.glb /tmp/s2.glb --quality 255 --compression 5

# 3. gltf-transform DECOMPRESSES Draco geometry and does not put it back, so the
#    file gets bigger unless this runs. High quantisation avoids adding error on
#    top of the export's own.
npx @gltf-transform/cli draco /tmp/s2.glb out.glb \
  --quantize-position 16 --quantize-normal 12 --quantize-texcoord 14

# 4. Hash, then update asset-manifest.ts
pnpm assets:hash public/3d/models/out.glb
```

Skipping stage 1 leaves most of the GPU cost in place (13.1 of `outdoor`'s
14.6 MB was in WebP textures). Skipping stage 3 makes the file *larger* on the
wire despite the texture savings.

Results of this pass:

| model | wire | VRAM |
|---|---|---|
| `officeItems` | 3407 → 2599 KB | 78.6 → 11.1 MB |
| `outdoor` | 338 → 560 KB | 14.6 → 2.4 MB |
| `contactPhone` | 506 → 478 KB | 11.3 → 1.5 MB |

`outdoor` grows on the wire because its sky gradients compress extremely well as
WebP and ETC1S is fixed-rate; the 12 MB of VRAM is worth 220 KB. First draw was
unaffected (~1.40 s either way — the transcoder runs on a worker).

`office` is already KTX2 and left alone. `outdoorCars` is already KTX2, is 170 KB
and 0.43 MB of VRAM, and only ever has 2 of its 36 car meshes in the render list,
so there is nothing to win by splitting it.

Anything loading a KTX2-textured model must use `useKTX2GLTF`, not drei's
`useGLTF`, or GLTFLoader throws `setKTX2Loader must be called before loading KTX2
textures`. That is why `contact-scene.tsx` uses it.

Map textures (`rain`, `basketballVa`) are still **overrides**: empty means the
committed file in `public/3d/textures/` is used.

## Updating

### Replacing a binary file (e.g. swapping a GLB)

1. Drop the new file into the right subfolder under `public/3d/`:
   - `models/` for `.glb` / `.gltf`
   - `textures/` for `.jpg` / `.png` / `.webp` / `.exr`
   - `audio/` for `.mp3`
   - `video/` for `.mp4`
2. Content-hash and rename it in place:
   ```bash
   pnpm assets:hash public/3d/models/office.glb
   # → renames to office-<sha8>.glb and prints the URL
   ```
3. Edit the matching URL in [`asset-manifest.ts`](./asset-manifest.ts). Section comments (`// --- Bakes ---`, `// --- SFX ---`, etc.) match the field groupings in `AssetsResult`.
4. Delete the old file.
5. Confirm:
   ```bash
   pnpm assets:verify
   ```

### Adding a brand-new asset

Same as above, plus a new entry in `asset-manifest.ts` under the right section. If it doesn't fit an existing `AssetsResult` field, you'll need to extend the [interface](../../components/assets-provider/fetch-assets.ts) too — TypeScript will tell you every consumer that needs to handle it.

### Editing inspectable copy (title, specs, description)

Sanity Studio → **3D Config** → **Inspectables** → expand the entry in the array → edit → publish.

### Tuning a scene's camera, postprocessing, or tab labels

Sanity Studio → **3D Config** → **Scenes** → expand the scene in the array → edit → publish.

### Adjusting physics

Sanity Studio → **3D Config** → **Physics** → edit the array → publish.

### Adding a new inspectable

1. Append an entry to `INSPECTABLES_META` in [`inspectables-meta.ts`](./inspectables-meta.ts) with the mesh-tied data:
   - `id` (unique, lowercase, alphanumeric — this is the contract with Sanity)
   - `mesh` (the 3D mesh name in the GLB)
   - `xOffset`, `yOffset`, `xRotationOffset`, `sizeTarget`
   - `scenes` (array of scene names where it appears)
   - `fx` (URL of the FX `.glb`, via `pnpm assets:hash`)
2. In Sanity Studio → **3D Config** → **Inspectables** → add a new entry to the array with the **same `inspectableId`**. Fill in title, specs, description. Publish.
3. The ID join happens at runtime. If a TS entry has no matching Sanity doc, the runtime renders with empty copy and logs a one-time warning per process.

### Changing mesh names (when the 3D model exports change)

Just edit the strings — `glassMaterials`, `doubleSideElements`, `bakes[].meshes`, `matcaps[].mesh`, `inspectables_meta[].mesh`, etc. These are literal mesh names from the GLB. Always update both the model and the manifest together.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm assets:hash <path>` | Content-hash a file and rename it in place. Idempotent. |
| `pnpm assets:exr-to-ktx2 <path>\|--all` | Convert HDR lightmap `.exr` to UASTC HDR `.ktx2`. Needs `basisu` (`brew install basis-universal`). |
| `pnpm tsx scripts/3d-assets/glb-recode-webp.ts <in> <out>` | Recode a GLB's WebP textures as PNG so gltf-transform's KTX pipeline can see them. |
| `pnpm assets:verify` | Walk the manifest, confirm every `/3d/...` URL resolves to a file on disk. Fails loudly if any are missing. |

## Cache headers

`/3d/*` assets are served with `Cache-Control: public, max-age=31536000, immutable` (see [`next.config.ts`](../../../next.config.ts)). This is safe because filenames are content-hashed — changing a file changes the URL, so stale CDN cache is impossible.

**Always content-hash before committing**, even for tiny edits. A file at a stable URL with new content will be served stale for up to a year. `pnpm assets:verify` enforces this — it fails on any file under `public/3d/` without an `-<8 hex chars>` suffix.
