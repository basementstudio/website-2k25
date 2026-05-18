# 3D Config

Source of truth for everything the 3D canvas needs at runtime: asset URLs, mesh names, scene configs, inspectables.

## Where things live

| Data | Location | Edited by |
|---|---|---|
| Binary files (GLB, EXR, JPG, WebP, PNG, MP3, MP4) | `public/3d/<category>/<name>-<hash>.<ext>` | Hand-edited |
| Asset URLs + mesh name lists | [`asset-manifest.ts`](./asset-manifest.ts) | Hand-edited |
| Per-inspectable mesh / offsets / fx URL | [`inspectables-meta.ts`](./inspectables-meta.ts) | Hand-edited |
| Inspectable title / specs / description (PortableText) | Sanity Studio → 3D Config → Inspectables | Editors in Studio |
| Scene camera / postprocessing / tab labels | Sanity Studio → 3D Config → Scenes | Editors in Studio |
| Physics tuning values | Sanity Studio → 3D Config → Physics | Editors in Studio |

On every request, [`fetch-assets-local.ts`](../../components/assets-provider/fetch-assets-local.ts) reads this directory and fetches the Sanity half, then joins them by inspectable `id` to produce the `AssetsResult` object that 25 downstream `useAssets()` consumers read. If a Sanity doc is missing, the affected inspectable renders with empty copy and logs a one-time warning.

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
| `pnpm assets:verify` | Walk the manifest, confirm every `/3d/...` URL resolves to a file on disk. Fails loudly if any are missing. |

## Cache headers

`/3d/*` assets are served with `Cache-Control: public, max-age=31536000, immutable` (see [`next.config.ts`](../../../next.config.ts)). This is safe because filenames are content-hashed — changing a file changes the URL, so stale CDN cache is impossible.

**Always content-hash before committing**, even for tiny edits. A file at a stable URL with new content will be served stale for up to a year. `pnpm assets:verify` enforces this — it fails on any file under `public/3d/` without an `-<8 hex chars>` suffix.
