# WebGL to WebGPU Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the rendering pipeline from WebGLRenderer to WebGPURenderer and convert all GLSL shaders to TSL for performance gains.

**Architecture:** Incremental migration — swap the renderer first (GLSL compat layer keeps existing shaders working), then convert each shader material from GLSL to TSL one at a time. Each task is independently testable and committable.

**Tech Stack:** Three.js 0.180.0, React Three Fiber 9.0.0-rc.6, TSL (Three Shading Language), WebGPURenderer, Next.js 15.6.0-canary.60

---

## Task 1: Swap WebGLRenderer to WebGPURenderer

**Files:**
- Modify: `src/components/scene/index.tsx:1-210`

**Step 1: Update imports**

Add the WebGPURenderer import and update the existing Three.js import:

```tsx
import * as THREE from "three"
import WebGPURenderer from "three/webgpu"
```

**Step 2: Change the `gl` prop on Canvas**

Replace the current `gl` prop (lines 155-160):

```tsx
gl={{
  antialias: false,
  alpha: false,
  outputColorSpace: THREE.SRGBColorSpace,
  toneMapping: THREE.NoToneMapping
}}
```

With an async renderer factory:

```tsx
gl={async (canvas) => {
  const renderer = new WebGPURenderer({
    canvas,
    antialias: false,
    alpha: false,
  })
  await renderer.init()
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping
  return renderer
}}
```

**Step 3: Verify the app starts and renders**

Run: `pnpm dev`
Expected: The site loads and renders the 3D scene. All existing GLSL shaders work via the WebGPURenderer's GLSL compatibility layer.

**Step 4: Commit**

```bash
git add src/components/scene/index.tsx
git commit -m "feat: swap WebGLRenderer to WebGPURenderer"
```

---

## Task 2: Update use-webgl hook to use-gpu

**Files:**
- Modify: `src/hooks/use-webgl.ts` → rename to `src/hooks/use-gpu.ts`
- Modify: `src/hooks/use-handle-contact.ts:6,14`

**Step 1: Rename and rewrite the hook**

Delete `src/hooks/use-webgl.ts` and create `src/hooks/use-gpu.ts`:

```ts
import { useEffect, useState } from "react"

export const useGpu = () => {
  const [gpuEnabled, setGpuEnabled] = useState(true)

  useEffect(() => {
    const hasWebGPU = typeof navigator !== "undefined" && "gpu" in navigator
    setGpuEnabled(hasWebGPU)
  }, [])

  return gpuEnabled
}
```

**Step 2: Update the consumer**

In `src/hooks/use-handle-contact.ts`, change:

```ts
import { useWebgl } from "@/hooks/use-webgl"
```
to:
```ts
import { useGpu } from "@/hooks/use-gpu"
```

And change line 14:
```ts
const webglEnabled = useWebgl()
```
to:
```ts
const webglEnabled = useGpu()
```

**Step 3: Verify**

Run: `pnpm dev`
Navigate to the contact button — it should still work the same way (opening the 3D contact form on desktop, routing to /contact on mobile or when GPU is unavailable).

**Step 4: Commit**

```bash
git add src/hooks/use-gpu.ts src/hooks/use-handle-contact.ts
git rm src/hooks/use-webgl.ts
git commit -m "refactor: rename use-webgl to use-gpu with WebGPU detection"
```

---

## Task 3: Replace WebGLRenderTarget with RenderTarget in double-fbo utility

**Files:**
- Modify: `src/utils/double-fbo.ts`

**Step 1: Update the type and constructor**

In Three.js 0.180.0, `WebGLRenderTarget` is still available but `RenderTarget` is the base class that works with both WebGL and WebGPU. However, since WebGPURenderer still accepts `WebGLRenderTarget`, keep using `WebGLRenderTarget` for now — it's an alias. The actual migration is just ensuring type compatibility.

Actually, check Three.js 0.180.0 — `WebGLRenderTarget` remains the class name even when used with WebGPURenderer. The WebGPU backend handles it internally. **No changes needed to this file for Phase 0.**

Skip this task — `WebGLRenderTarget` works with WebGPURenderer as-is in Three.js 0.180.0.

---

## Task 4: Verify postprocessing renderer works with WebGPU

**Files:**
- Verify: `src/components/postprocessing/renderer.tsx`

No code changes needed. `WebGLRenderTarget` is compatible with WebGPURenderer. The `gl.setRenderTarget()` and `gl.render()` calls work identically.

**Step 1: Manual verification**

Run: `pnpm dev`
Expected: Post-processing (bloom, vignette, color correction) renders correctly.

---

## Task 5: Verify arcade screen render-texture works with WebGPU

**Files:**
- Verify: `src/components/arcade-screen/render-texture.tsx`
- Verify: `src/components/arcade-screen/index.tsx`

No code changes needed. `WebGLRenderTarget` works with WebGPURenderer.

**Step 1: Manual verification**

Run: `pnpm dev`
Navigate to the arcade/lab section. The arcade screen should render correctly with its render-to-texture pipeline.

---

## Task 6: Create TSL utility helpers (value-remap, basic-light)

**Files:**
- Create: `src/shaders/utils/value-remap.ts`
- Create: `src/shaders/utils/basic-light.ts`
- Keep: `src/shaders/utils/value-remap.glsl` (still used by unconverted shaders)
- Keep: `src/shaders/utils/basic-light.glsl` (still used by unconverted shaders)

**Step 1: Create value-remap TSL utility**

Create `src/shaders/utils/value-remap.ts`:

```ts
import { clamp, div, float, mul, sub, add, Fn, vec2, vec3 } from "three/tsl"
import type { ShaderNodeObject, Node } from "three/tsl"

export const valueRemap = Fn(
  ([value, inMin, inMax, outMin, outMax]: [
    ShaderNodeObject<Node>,
    ShaderNodeObject<Node>,
    ShaderNodeObject<Node>,
    ShaderNodeObject<Node>,
    ShaderNodeObject<Node>
  ]) => {
    return add(outMin, mul(div(sub(value, inMin), sub(inMax, inMin)), sub(outMax, outMin)))
  }
)

export const valueRemapNormalized = Fn(
  ([value, inMin, inMax]: [
    ShaderNodeObject<Node>,
    ShaderNodeObject<Node>,
    ShaderNodeObject<Node>
  ]) => {
    return div(sub(value, inMin), sub(inMax, inMin))
  }
)
```

**Step 2: Create basic-light TSL utility**

Create `src/shaders/utils/basic-light.ts`:

```ts
import { dot, normalize, clamp, pow, mul, add, float, Fn } from "three/tsl"
import type { ShaderNodeObject, Node } from "three/tsl"
import { valueRemap } from "./value-remap"

export const basicLight = Fn(
  ([normal, lightDir, intensity]: [
    ShaderNodeObject<Node>,
    ShaderNodeObject<Node>,
    ShaderNodeObject<Node>
  ]) => {
    const lightFactor = dot(lightDir, normalize(normal))
    const remapped = valueRemap(lightFactor, float(0.2), float(1.0), float(0.1), float(1.0))
    const clamped = clamp(remapped, 0.0, 1.0)
    const powered = pow(clamped, float(2.0))
    return add(mul(powered, intensity), float(1.0))
  }
)
```

**Step 3: Commit**

```bash
git add src/shaders/utils/value-remap.ts src/shaders/utils/basic-light.ts
git commit -m "feat: add TSL utility helpers for value-remap and basic-light"
```

---

## Task 7: Migrate material-steam (Tier 1 — simplest shader)

**Files:**
- Modify: `src/shaders/material-steam/index.ts`
- Delete: `src/shaders/material-steam/vertex.glsl`
- Delete: `src/shaders/material-steam/fragment.glsl`

**Step 1: Rewrite the material factory to TSL**

Replace `src/shaders/material-steam/index.ts`:

```ts
import {
  Fn,
  uniform,
  uv,
  texture,
  float,
  vec2,
  vec3,
  vec4,
  smoothstep,
  mod,
  floor,
  mul,
  sub,
  add,
  clamp,
  discard,
  sin,
  cos,
  mat2,
  positionLocal,
  modelWorldMatrix,
  cameraProjectionMatrix,
  modelViewMatrix,
  assign,
  varying,
  varyingProperty
} from "three/tsl"
import { DoubleSide, NodeMaterial, Texture } from "three"

export const createSteamMaterial = () => {
  const uTime = uniform(0)
  const uNoise = uniform(null as Texture | null)

  const material = new NodeMaterial()
  material.transparent = true
  material.side = DoubleSide

  // Vertex: twist + offset based on noise
  material.vertexNode = Fn(() => {
    const vUv = uv()
    const noiseOffset = texture(uNoise, vec2(float(0.25), mul(uTime, 0.005))).r
    const offset = vec2(mul(noiseOffset, mul(pow(vUv.y, float(1.2)), 0.035)), float(0.0))

    const pos = positionLocal.toVar()
    pos.x.addAssign(offset.x)
    pos.z.addAssign(offset.x)

    const twist = texture(uNoise, vec2(float(0.5), sub(mul(vUv.y, 0.2), mul(uTime, 0.005)))).r
    const angle = mul(twist, 8.0)
    const s = sin(angle)
    const c = cos(angle)
    const newX = sub(mul(pos.x, c), mul(pos.z, s))
    const newZ = add(mul(pos.x, s), mul(pos.z, c))
    pos.x.assign(newX)
    pos.z.assign(newZ)

    return cameraProjectionMatrix.mul(modelViewMatrix).mul(vec4(pos, 1.0))
  })()

  // Fragment
  material.colorNode = Fn(() => {
    const vUv = uv()
    const steamUv = vec2(mul(vUv.x, 0.5), sub(mul(vUv.y, 0.3), mul(uTime, 0.015)))
    const steam = smoothstep(float(0.45), float(1.0), texture(uNoise, steamUv).r)

    const edgeFadeX = mul(
      smoothstep(float(0.0), float(0.15), vUv.x),
      sub(float(1.0), smoothstep(float(0.85), float(1.0), vUv.x))
    )
    const edgeFadeY = mul(
      smoothstep(float(0.0), float(0.15), vUv.y),
      sub(float(1.0), smoothstep(float(0.85), float(1.0), vUv.y))
    )

    const fadedSteam = mul(steam, mul(edgeFadeX, edgeFadeY))

    const pattern = mod(
      add(floor(mul(screenCoordinate.x, 0.5)), floor(mul(screenCoordinate.y, 0.5))),
      float(2.0)
    )

    const gradient = clamp(sub(add(float(0.2), sub(float(1.0), mul(float(1.25), vUv.y))), float(0.0)), 0.0, 1.0)

    const alpha = mul(fadedSteam, mul(pattern, gradient))

    discard(alpha.lessThan(0.001))

    return vec4(vec3(0.92, 0.78, 0.62), alpha)
  })()

  return { material, uniforms: { uTime, uNoise } }
}
```

> **Note:** The exact TSL API calls above are approximate — TSL's API in Three.js 0.180.0 may vary. The implementing engineer should reference the Three.js TSL examples at `node_modules/three/examples/jsm/` and the TSL docs. The key pattern is: use `NodeMaterial`, set `vertexNode` / `colorNode` / `opacityNode`, and use TSL functions instead of GLSL.

**Step 2: Update all consumers of createSteamMaterial**

Search for `createSteamMaterial` usage and update them to use the new `{ material, uniforms }` return shape. The old pattern `material.uniforms.uTime.value = x` becomes `uniforms.uTime.value = x`.

**Step 3: Delete GLSL files**

```bash
git rm src/shaders/material-steam/vertex.glsl src/shaders/material-steam/fragment.glsl
```

**Step 4: Verify**

Run: `pnpm dev`
Check that the steam effect renders correctly in the scene.

**Step 5: Commit**

```bash
git add src/shaders/material-steam/
git commit -m "feat: migrate material-steam from GLSL to TSL"
```

---

## Task 8: Migrate material-not-found (Tier 1)

**Files:**
- Modify: `src/shaders/material-not-found/index.ts`
- Delete: `src/shaders/material-not-found/vertex.glsl`
- Delete: `src/shaders/material-not-found/fragment.glsl`

**Step 1: Rewrite to TSL NodeMaterial**

The not-found shader does: UV manipulation (shake, rotation), texture sampling with bleeding, scanlines, noise, grayscale tint. Convert all of these to TSL node operations.

Key conversions:
- `texture2D(tDiffuse, uv)` → `texture(tDiffuseUniform, uvNode)`
- `sin/cos/fract/dot` → `sin/cos/fract/dot` from `three/tsl`
- `gl_FragColor` → return from `colorNode` Fn
- `varying vec2 vUv` → `uv()` built-in

The factory should return `{ material, uniforms: { tDiffuse, uTime, resolution } }`.

**Step 2: Update consumers**

In `src/shaders/material-global-shader/index.tsx` and `src/components/map/index.tsx`, search for `createNotFoundMaterial` and update to use the new return shape.

**Step 3: Delete GLSL files, verify, commit**

```bash
git rm src/shaders/material-not-found/vertex.glsl src/shaders/material-not-found/fragment.glsl
git add src/shaders/material-not-found/index.ts
git commit -m "feat: migrate material-not-found from GLSL to TSL"
```

---

## Task 9: Migrate material-screen (Tier 1)

**Files:**
- Modify: `src/shaders/material-screen/index.ts`
- Delete: `src/shaders/material-screen/vertex.glsl`
- Delete: `src/shaders/material-screen/fragment.glsl`

This is the most complex Tier 1 shader — it has CRT-like effects (curve remap, interference, scanlines, noise, vignette, reveal animation, pixelation). Take care to replicate each effect faithfully.

**Step 1: Rewrite to TSL**

Key conversions:
- The vertex shader uses `#include` chunks (skinning, logdepthbuf) — in TSL, these are handled automatically by the NodeMaterial pipeline
- The fragment has complex UV manipulation — convert each function (`curveRemapUV`, `random`, `peak`) to TSL `Fn` helpers
- Conditional logic (`if/else`) needs to use TSL's `select()` or `cond()` functions
- The `uFlip` conditional block with pixelation needs careful conversion

**Step 2: Update consumers**

In `src/components/arcade-screen/index.tsx`, `createScreenMaterial()` is called and uniforms are accessed directly. Update to the new return shape.

**Step 3: Delete GLSL files, verify, commit**

```bash
git rm src/shaders/material-screen/vertex.glsl src/shaders/material-screen/fragment.glsl
git add src/shaders/material-screen/index.ts
git commit -m "feat: migrate material-screen from GLSL to TSL"
```

---

## Task 10: Migrate routing-element shader (Tier 1)

**Files:**
- Modify: `src/components/routing-element/routing-element.tsx:32-53`
- Delete: `src/components/routing-element/vert.glsl`
- Delete: `src/components/routing-element/frag.glsl`

**Step 1: Create inline TSL material in routing-element.tsx**

Replace the `ShaderMaterial` creation in `useMemo` (line 33) with a `NodeMaterial`. The shader does: border detection using UV derivatives (`dFdx`/`dFdy`), diagonal line pattern, padding/border logic.

Key conversions:
- `dFdx(vUv)` / `dFdy(vUv)` → TSL `dFdx()` / `dFdy()`
- The checkerboard/diagonal pattern needs TSL math
- Uniforms become TSL `uniform()` nodes

**Step 2: Update uniform access**

Lines 257-258 access `routingMaterial.uniforms.borderPadding.value` and `routingMaterial.uniforms.opacity.value`. Change to TSL uniform `.value` assignment.

**Step 3: Delete GLSL files, verify, commit**

```bash
git rm src/components/routing-element/vert.glsl src/components/routing-element/frag.glsl
git add src/components/routing-element/routing-element.tsx
git commit -m "feat: migrate routing-element shader from GLSL to TSL"
```

---

## Task 11: Migrate sparkles shader (Tier 1)

**Files:**
- Modify: `src/components/sparkles/index.tsx`
- Delete: `src/components/sparkles/vert.glsl`
- Delete: `src/components/sparkles/frag.glsl`

**Step 1: Replace shaderMaterial from drei with TSL NodeMaterial**

The current implementation uses `shaderMaterial()` from `@react-three/drei` with `extend()`. Replace with a custom `NodeMaterial` class.

Key conversions:
- The vertex shader does point-based rendering with custom size, jitter animation, and pulsing opacity — use TSL's `pointSizeNode` and custom position transforms
- The fragment shader uses `vColor`, `vOpacity`, and `fadeFactor` — set `colorNode` and `opacityNode` on the NodeMaterial
- `#include <tonemapping_fragment>` and `#include <colorspace_fragment>` are handled automatically by NodeMaterial

**Step 2: Update SparklesImpl integration**

The `<SparklesImpl>` from drei may need a different approach since we're replacing the material. Check if `SparklesImpl` accepts a custom material child.

**Step 3: Delete GLSL files, verify, commit**

```bash
git rm src/components/sparkles/vert.glsl src/components/sparkles/frag.glsl
git add src/components/sparkles/index.tsx
git commit -m "feat: migrate sparkles shader from GLSL to TSL"
```

---

## Task 12: Migrate material-net (Tier 2)

**Files:**
- Modify: `src/shaders/material-net/index.ts`
- Delete: `src/shaders/material-net/vertex.glsl`
- Delete: `src/shaders/material-net/fragment.glsl`

**Step 1: Rewrite to TSL**

The net shader does vertex displacement from a DataTexture based on frame animation. Key conversions:
- Custom attribute `uv1` → use `attribute()` from TSL or `bufferAttribute()`
- `texture2D(tDisplacement, vDisplacementUv).xzy` → TSL texture sampling with swizzle
- Vertex position offset → `positionLocal` manipulation in `vertexNode`
- Fragment is simple: `texture2D(map, vUv)` → `texture(mapUniform, uv())`

**Step 2: Update consumers, delete GLSL, verify, commit**

```bash
git rm src/shaders/material-net/vertex.glsl src/shaders/material-net/fragment.glsl
git add src/shaders/material-net/index.ts
git commit -m "feat: migrate material-net from GLSL to TSL"
```

---

## Task 13: Migrate material-postprocessing (Tier 2)

**Files:**
- Modify: `src/shaders/material-postprocessing/index.ts`
- Modify: `src/components/postprocessing/post-processing.tsx` (uniform access updates)
- Delete: `src/shaders/material-postprocessing/vertex.glsl`
- Delete: `src/shaders/material-postprocessing/fragment.glsl`

**Step 1: Rewrite to TSL**

This is a full-screen post-processing shader with: bloom (Vogel disk sampling), vignette, ACES tone mapping, contrast/brightness/gamma/exposure, scanlines, noise. This is complex but well-structured.

Key conversions:
- The bloom loop (`for (int i = 1; i < SAMPLE_COUNT; i++)`) needs TSL's `Loop()` construct
- ACES tone mapping matrices → TSL `mat3()` and matrix multiplication
- `gl_FragCoord` → `screenCoordinate` or `screenUV` from TSL
- `#include <colorspace_fragment>` → handled by NodeMaterial output

**Step 2: Update post-processing.tsx**

Lines 113-158 access uniforms via `material.uniforms.uContrast.value` etc. Change all to TSL uniform `.value` access on the returned uniforms object.

**Step 3: Delete GLSL, verify, commit**

```bash
git rm src/shaders/material-postprocessing/vertex.glsl src/shaders/material-postprocessing/fragment.glsl
git add src/shaders/material-postprocessing/index.ts src/components/postprocessing/post-processing.tsx
git commit -m "feat: migrate material-postprocessing from GLSL to TSL"
```

---

## Task 14: Migrate material-characters (Tier 2)

**Files:**
- Modify: `src/shaders/material-characters/index.ts`
- Delete: `src/shaders/material-characters/vertex.glsl`
- Delete: `src/shaders/material-characters/fragment.glsl`

**Step 1: Rewrite to TSL**

This shader has: multi-map support via defines (`USE_MULTI_MAP`, `MULTI_MAP_COUNT`), instanced lighting with texture lookups, skinning/batching/morphing via `#include` chunks, gamma correction, and point lighting.

Key considerations:
- The `#include` chunks for batching/skinning/morphing are handled by the `InstancedBatchedSkinnedMesh` class which patches `ShaderChunk`. When this shader is converted to TSL, the instanced-skinned-mesh system (Task 18) must also be converted, since TSL NodeMaterials don't use ShaderChunk.
- **Alternative:** Keep this shader as GLSL until Task 18 (instanced-skinned-mesh migration), then convert both together.

**Decision: Defer this task to after Task 18.** The character material depends heavily on the instanced skinning system.

---

## Task 15: Migrate material-solid-reveal (Tier 2)

**Files:**
- Modify: `src/shaders/material-solid-reveal/index.ts`
- Delete: `src/shaders/material-solid-reveal/vertex.glsl`
- Delete: `src/shaders/material-solid-reveal/fragment.glsl`

**Step 1: Rewrite to TSL**

Currently uses `RawShaderMaterial` with `GLSL3`. Uses `glsl-noise` for 3D/4D classic Perlin noise. Key conversions:
- `#pragma glslify: cnoise3 = require(glsl-noise/classic/3d)` → TSL's `mx_noise_float()` or `mx_perlin_noise_float()`
- VoxelData struct → compute in a TSL `Fn`
- `worldToUv()` helper → TSL camera projection math
- `discard` → TSL `discard(condition)`

**Note:** The visual output of TSL's MaterialX noise may differ from glsl-noise's classic Perlin noise. Visual comparison is required.

**Step 2: Update loading-scene consumer, delete GLSL, verify, commit**

```bash
git rm src/shaders/material-solid-reveal/vertex.glsl src/shaders/material-solid-reveal/fragment.glsl
git add src/shaders/material-solid-reveal/index.ts
git commit -m "feat: migrate material-solid-reveal from GLSL to TSL"
```

---

## Task 16: Migrate material-flow (Tier 3)

**Files:**
- Modify: `src/shaders/material-flow/index.ts`
- Delete: `src/shaders/material-flow/vertex.glsl`
- Delete: `src/shaders/material-flow/fragment.glsl`

**Step 1: Rewrite to TSL**

Currently uses `RawShaderMaterial` with `GLSL3`. This is a feedback simulation shader. Key conversions:
- `textureSize(uFeedbackTexture, 0)` → TSL `textureSize()` or compute size from uniform
- `textureLod(uFeedbackTexture, uv, 0.0)` → TSL `textureSampleLevel()` or `texture().level(0)`
- `#pragma glslify: cnoise2 = require(glsl-noise/classic/2d)` → TSL noise
- The feedback loop logic (sampling neighbors, checking growth) needs careful TSL conversion
- `gl_Position = vec4(position, 1.0)` for fullscreen quad → TSL vertex position

**Step 2: Update loading-scene consumer, delete GLSL, verify, commit**

```bash
git rm src/shaders/material-flow/vertex.glsl src/shaders/material-flow/fragment.glsl
git add src/shaders/material-flow/index.ts
git commit -m "feat: migrate material-flow from GLSL to TSL"
```

---

## Task 17: Migrate material-global-shader (Tier 3 — largest shader)

**Files:**
- Modify: `src/shaders/material-global-shader/index.tsx`
- Delete: `src/shaders/material-global-shader/vertex.glsl`
- Delete: `src/shaders/material-global-shader/fragment.glsl`

**Step 1: Plan the conversion**

This is the most complex shader with conditional compilation via defines: `GLASS`, `GODRAY`, `LIGHT`, `BASKETBALL`, `FOG`, `VIDEO`, `MATCAP`, `CLOUDS`, `DAYLIGHT`, `IS_LOBO_MARINO`, `USE_MAP`, `IS_TRANSPARENT`, `USE_ALPHA_MAP`, `USE_EMISSIVE`, `USE_EMISSIVEMAP`.

In TSL, conditional compilation becomes runtime branching with `cond()` / `select()`, or you build up the node graph conditionally in TypeScript:

```ts
if (defines.GLASS) {
  // add glass nodes to the graph
}
```

This is actually cleaner than GLSL `#ifdef`.

**Step 2: Rewrite to TSL**

Key conversions:
- Lightmap, AO map, emissive, fog, glass reflection, godray, matcap → each becomes a conditional node graph addition
- The Zustand store tracking (`useCustomShaderMaterial`) needs updating since `NodeMaterial` has a different API than `ShaderMaterial`
- `customProgramCacheKey` → check if NodeMaterial supports this
- `#pragma glslify: valueRemap` → use the TSL `valueRemap` from Task 6
- `#pragma glslify: basicLight` → use the TSL `basicLight` from Task 6

**Step 3: Update all consumers**

The global shader is used in `src/components/map/index.tsx` and elsewhere. All `material.uniforms.x.value` access must be updated.

**Step 4: Delete GLSL, verify, commit**

```bash
git rm src/shaders/material-global-shader/vertex.glsl src/shaders/material-global-shader/fragment.glsl
git add src/shaders/material-global-shader/index.tsx
git commit -m "feat: migrate material-global-shader from GLSL to TSL"
```

---

## Task 18: Migrate instanced-skinned-mesh (Tier 3 — most architecturally complex)

**Files:**
- Modify: `src/components/characters/instanced-skinned-mesh/instanced-skinned-mesh.ts`
- Modify: `src/components/characters/instanced-skinned-mesh/index.tsx`

**Step 1: Understand the current approach**

The current system patches `THREE.ShaderChunk.skinning_pars_vertex` and `THREE.ShaderChunk.skinning_vertex` with custom GLSL that:
1. Reads bone matrices from a `boneTexture` DataTexture
2. Reads keyframe indices from a `batchingKeyframeTexture` DataTexture
3. Applies skeletal animation per-instance using texture lookups
4. Supports morph targets via `morphDataTexture`
5. Uses `onBeforeCompile` to inject uniforms and defines

**Step 2: Convert to TSL approach**

In TSL, the equivalent approach is:
- Use TSL's `storage()` or `texture()` nodes to read the bone/keyframe textures
- Override `vertexNode` on the material to apply the custom skinning
- Remove the `ShaderChunk` patching entirely
- Remove the `onBeforeCompile` callback — use `NodeMaterial` directly

This is the highest-risk task. The implementing engineer should:
1. Study Three.js TSL skinning examples
2. Check if `BatchedMesh` already works with `NodeMaterial` in r180
3. Consider if the bone texture approach can be replaced with TSL's built-in instancing

**Step 3: Verify character animations**

Run: `pnpm dev`
Check all character animations render and play correctly. Test multiple characters on screen simultaneously.

**Step 4: Commit**

```bash
git add src/components/characters/instanced-skinned-mesh/
git commit -m "feat: migrate instanced-skinned-mesh from ShaderChunk patching to TSL"
```

---

## Task 19: Now migrate material-characters (Tier 2, deferred from Task 14)

**Files:**
- Modify: `src/shaders/material-characters/index.ts`
- Delete: `src/shaders/material-characters/vertex.glsl`
- Delete: `src/shaders/material-characters/fragment.glsl`

Now that the instanced skinning system uses TSL (Task 18), convert the character material.

**Step 1: Rewrite to TSL NodeMaterial**

The multi-map support (`USE_MULTI_MAP` with `MULTI_MAP_COUNT`) becomes runtime TypeScript logic building up the node graph. The lighting calculations use the TSL `basicLight` helper.

**Step 2: Delete GLSL, verify character rendering, commit**

```bash
git rm src/shaders/material-characters/vertex.glsl src/shaders/material-characters/fragment.glsl
git add src/shaders/material-characters/index.ts
git commit -m "feat: migrate material-characters from GLSL to TSL"
```

---

## Task 20: Migrate CRT mesh inline shaders (Tier 4)

**Files:**
- Modify: `src/components/doom-js/crt-mesh.tsx`

**Step 1: Convert inline GLSL to TSL**

Replace the `vertexShader` and `fragmentShader` string literals with TSL node graph. Replace `<shaderMaterial>` JSX with a `NodeMaterial` instance.

Key conversions:
- Barrel distortion → TSL math
- Chromatic aberration (sampling texture at 3 UV offsets) → 3 `texture()` calls with swizzle
- Scanlines, flicker, vignette, noise, phosphor glow → TSL math
- The material is created in JSX (`<shaderMaterial ... />`) — change to `<primitive object={material} attach="material" />`

**Step 2: Verify, commit**

```bash
git add src/components/doom-js/crt-mesh.tsx
git commit -m "feat: migrate CRT mesh inline shaders from GLSL to TSL"
```

---

## Task 21: Migrate loading scene inline shaders (Tier 4)

**Files:**
- Modify: `src/components/loading/loading-scene/index.tsx`

**Step 1: Convert inline GLSL to TSL**

The loading scene has an inline `ShaderMaterial` for the wireframe lines (lines 160-212) with vertex + fragment shaders. Convert to a `NodeMaterial`.

Key conversions:
- Vertex: world position → TSL `positionWorld`
- Fragment: reveal based on world Z position, uniform color/opacity

**Step 2: Update the flow rendering pipeline**

The `renderFlow` function (lines 311-347) uses `gl.setRenderTarget()` — this continues to work with WebGPURenderer, no changes needed there.

**Step 3: Verify loading screen, commit**

```bash
git add src/components/loading/loading-scene/index.tsx
git commit -m "feat: migrate loading scene inline shaders from GLSL to TSL"
```

---

## Task 22: Remove GLSL utility shaders

**Files:**
- Delete: `src/shaders/utils/basic-light.glsl`
- Delete: `src/shaders/utils/value-remap.glsl`

**Step 1: Verify no remaining GLSL imports**

Search the codebase for any remaining `.glsl` imports:

```bash
grep -r "\.glsl" src/ --include="*.ts" --include="*.tsx"
```

Expected: No results. All GLSL files should be deleted by now.

**Step 2: Delete and commit**

```bash
git rm src/shaders/utils/basic-light.glsl src/shaders/utils/value-remap.glsl
git commit -m "chore: remove GLSL utility shaders (replaced by TSL)"
```

---

## Task 23: Remove GLSL build configuration and dependencies

**Files:**
- Modify: `next.config.ts:6-13,41-48`
- Modify: `package.json` (remove devDependencies)

**Step 1: Remove webpack GLSL loader rules**

In `next.config.ts`, remove the turbopack rules (lines 6-13):

```ts
turbopack: {
  rules: {
    "*.{glsl,vert,frag,vs,fs}": {
      loaders: ["raw-loader", "glslify-loader"],
      as: "*.js"
    }
  }
},
```

And remove the webpack rule (lines 41-48):

```ts
webpack: (config) => {
  config.module.rules.push({
    test: /\.(glsl|vs|fs|vert|frag)$/,
    use: ["raw-loader", "glslify-loader"]
  })

  return config
},
```

**Step 2: Remove dependencies**

```bash
pnpm remove raw-loader glslify-loader glsl-noise
```

**Step 3: Verify build**

```bash
pnpm build
```

Expected: Build succeeds with no GLSL-related errors.

**Step 4: Commit**

```bash
git add next.config.ts package.json pnpm-lock.yaml
git commit -m "chore: remove GLSL loader config and dependencies"
```

---

## Task 24: Final verification and cleanup

**Step 1: Full build verification**

```bash
pnpm build
```

**Step 2: Visual regression check**

Run `pnpm dev` and manually verify every scene:
- Home page: characters, sparkles, godrays, fog, lighting
- Lab: arcade screen, CRT effect, render-to-texture
- Services: glass materials, matcap reflections
- 404: not-found material on TV, CCTV render target
- Loading screen: flow simulation, solid reveal, wireframe lines
- Contact: offscreen canvas animation
- Basketball: lighting, physics
- Post-processing: bloom, vignette, color correction across all scenes

**Step 3: Performance comparison**

Use Chrome DevTools Performance tab to compare:
- Frame time before (WebGL) vs after (WebGPU)
- GPU utilization
- Draw call counts

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete WebGL to WebGPU migration"
```
