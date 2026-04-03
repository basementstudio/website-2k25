# Fix Lamp Lighting for WebGPU

## Problem
Two lamp-related issues after the WebGL → WebGPU migration:
1. **Glow disc** renders as solid gray disc (already fixed with AdditiveBlending)
2. **Scene lightmaps** don't change when the lamp toggles on/off, and lighting looks wrong from the start

## Root Cause Analysis

The lamp toggle relies on swapping lightmaps on 7 target meshes (`SM_06_01`–`SM_06_07`) via the `lightLampEnabled` uniform. The shader mixes between two lightmaps:
- Regular baked lightmap (from BakesLoader, includes lamp light)
- Lamp-off EXR lightmap (loaded in Lamp component, without lamp light)

Static analysis confirms:
- Three.js binding system (`NodeSampledTexture.update()`) correctly detects texture reference changes at runtime
- The TSL shader mix formula is equivalent to the old GLSL if/else
- The UV2 fallback logic is identical
- The compat layer `.value` access works for both TextureNode and UniformNode

The most likely remaining issue is **texture property timing**: BakesLoader and Lamp component modify texture properties (flipY, filter, colorSpace) AFTER loading but BEFORE assignment to TextureNodes. If the GPU texture is created before these changes take effect, the lightmap will be uploaded with wrong sampling parameters.

## Fix Strategy

### Fix 1: Force texture re-upload after property changes in BakesLoader

`src/components/map/bakes.tsx` — After setting flipY/filter/colorSpace on each loaded texture, call `texture.needsUpdate = true` to ensure the GPU texture is created with the correct properties when the binding system processes the reference change.

**Lightmaps** (line ~103-107):
```typescript
map.flipY = true
map.generateMipmaps = false
map.minFilter = NearestFilter
map.magFilter = NearestFilter
map.colorSpace = NoColorSpace
map.needsUpdate = true  // <-- ADD
```

**AO maps** (line ~119-123):
```typescript
map.flipY = false
map.generateMipmaps = false
map.minFilter = NearestFilter
map.magFilter = NearestFilter
map.colorSpace = NoColorSpace
map.needsUpdate = true  // <-- ADD
```

**Matcaps** (line ~134-138):
```typescript
map.flipY = false
map.generateMipmaps = false
map.minFilter = NearestFilter
map.magFilter = NearestFilter
map.colorSpace = NoColorSpace
map.needsUpdate = true  // <-- ADD
```

**Reflexes** (line ~149-153):
```typescript
map.flipY = false
map.colorSpace = NoColorSpace
map.generateMipmaps = false
map.minFilter = NearestFilter
map.magFilter = NearestFilter
map.needsUpdate = true  // <-- ADD
```

### Fix 2: Force texture re-upload for lamp EXR lightmap

`src/components/lamp/index.tsx` — After modifying the EXR lightmap properties:
```typescript
useEffect(() => {
  lightmap.flipY = true
  lightmap.generateMipmaps = false
  lightmap.minFilter = THREE.NearestFilter
  lightmap.magFilter = THREE.NearestFilter
  lightmap.colorSpace = THREE.NoColorSpace
  lightmap.needsUpdate = true  // <-- ADD
}, [lightmap])
```

### Fix 3: Use proper placeholder texture instead of empty Texture

`src/shaders/material-global-shader/index.tsx` — Replace `BLANK_TEXTURE` with a 1×1 white DataTexture that has a defined format. An empty `new Texture()` has no image data and undefined format, which could cause WebGPU backend issues during initial pipeline creation.

```typescript
import { DataTexture, RGBAFormat, UnsignedByteType } from "three"

const BLANK_TEXTURE = (() => {
  const data = new Uint8Array([255, 255, 255, 255])
  const tex = new DataTexture(data, 1, 1, RGBAFormat, UnsignedByteType)
  tex.needsUpdate = true
  return tex
})()
```

This ensures:
- The initial texture has a valid GPU format for pipeline compilation
- The 1×1 white pixel produces `vec4(1,1,1,1)` when sampled, which is the correct multiplicative identity (no visual effect on irradiance)

## Files Modified

| File | Change |
|------|--------|
| `src/components/map/bakes.tsx` | Add `needsUpdate = true` after all texture property changes |
| `src/components/lamp/index.tsx` | Add `needsUpdate = true` after EXR property changes |
| `src/shaders/material-global-shader/index.tsx` | Replace empty `Texture()` with 1×1 white `DataTexture` |

## What Stays Unchanged
- The lamp toggle logic (lightLampEnabled uniform, mix formula)
- The glow disc fix (AdditiveBlending) from earlier
- BakesLoader's texture assignment flow
- The UV2 fallback logic

## Verification
1. `pnpm tsc --noEmit` — TypeScript
2. `pnpm build` — Build
3. Navigate to blog section → scene should have correct baked lighting
4. Pull lamp cord → scene should visibly darken (lamp OFF)
5. Pull again → scene should brighten (lamp ON)
6. Lamp glow disc should appear as soft additive glow, not solid disc
