# WebGL to WebGPU Migration Design

## Goal

Migrate the rendering pipeline from WebGLRenderer to WebGPURenderer and convert all GLSL shaders to TSL (Three Shading Language) for performance improvements. The project already uses Three.js 0.180.0 and R3F 9.0.0-rc.6, both of which support WebGPU.

## Approach

Incremental migration: swap the renderer first (GLSL compat layer keeps existing shaders working), then convert shaders to TSL one by one.

---

## Phase 0: Renderer Swap

Switch from WebGLRenderer to WebGPURenderer. All existing GLSL shaders continue working via the compatibility layer.

### Files changed

1. **`src/components/scene/index.tsx`** — Replace `gl` prop with async WebGPURenderer factory
2. **`src/hooks/use-webgl.ts`** — Rename to `use-gpu.ts`, detect WebGPU via `navigator.gpu`, fall back to WebGL
3. **`src/utils/double-fbo.ts`** — `WebGLRenderTarget` -> `RenderTarget`
4. **`src/components/postprocessing/renderer.tsx`** — `WebGLRenderTarget` -> `RenderTarget`, update depth texture creation
5. **`src/components/arcade-screen/render-texture.tsx`** — `WebGLRenderTarget` -> `RenderTarget`
6. **`src/components/contact/contact-canvas.tsx`** — Verify offscreen canvas compatibility with WebGPU

---

## Phase 1: Shader Migration (GLSL -> TSL)

Convert each shader material from GLSL files + ShaderMaterial to TSL node materials. For each shader:
- Delete `.glsl` vertex/fragment files
- Rewrite TypeScript factory to use TSL node functions
- Replace `ShaderMaterial`/`RawShaderMaterial` with `NodeMaterial`
- Update uniform access from `material.uniforms.x.value` to TSL uniform `.value`

### Tier 1 — Simple

| # | Shader | Files | Notes |
|---|--------|-------|-------|
| 1 | material-screen | `src/shaders/material-screen/{vertex.glsl,fragment.glsl,index.ts}` | Texture + reveal |
| 2 | material-not-found | `src/shaders/material-not-found/{vertex.glsl,fragment.glsl,index.ts}` | Time distortion |
| 3 | material-steam | `src/shaders/material-steam/{vertex.glsl,fragment.glsl,index.ts}` | Basic effect |
| 4 | routing-element | `src/components/routing-element/{vert.glsl,frag.glsl,routing-element.tsx}` | Resolution + opacity |
| 5 | sparkles | `src/components/sparkles/{vert.glsl,frag.glsl,index.tsx}` | Particle shader |

### Tier 2 — Medium

| # | Shader | Files | Notes |
|---|--------|-------|-------|
| 6 | material-net | `src/shaders/material-net/{vertex.glsl,fragment.glsl,index.ts}` | Data texture displacement |
| 7 | material-postprocessing | `src/shaders/material-postprocessing/{vertex.glsl,fragment.glsl,index.ts}` | Bloom, vignette, color |
| 8 | material-characters | `src/shaders/material-characters/{vertex.glsl,fragment.glsl,index.ts}` | Texture + fade |
| 9 | material-solid-reveal | `src/shaders/material-solid-reveal/{vertex.glsl,fragment.glsl,index.ts}` | RawShaderMaterial + GLSL3 |

### Tier 3 — Complex

| # | Shader | Files | Notes |
|---|--------|-------|-------|
| 10 | material-flow | `src/shaders/material-flow/{vertex.glsl,fragment.glsl,index.ts}` | Feedback simulation, RawShaderMaterial + GLSL3 |
| 11 | material-global-shader | `src/shaders/material-global-shader/{vertex.glsl,fragment.glsl,index.tsx}` | Glass, godray, lighting, fog, video, matcap, clouds, daylight. Conditional compilation via defines. |
| 12 | instanced-skinned-mesh | `src/components/characters/instanced-skinned-mesh/{instanced-skinned-mesh.ts,index.tsx}` | ShaderChunk patching for instanced skeletal animation |

### Tier 4 — Inline shaders

| # | Shader | Files | Notes |
|---|--------|-------|-------|
| 13 | CRT mesh | `src/components/doom-js/crt-mesh.tsx` | Inline GLSL: barrel distortion, chromatic aberration, scanlines |
| 14 | Loading scene | `src/components/loading/loading-scene/index.tsx` | Inline reveal shaders |

### Utility shaders

- `src/shaders/utils/basic-light.glsl` -> TSL helper function
- `src/shaders/utils/value-remap.glsl` -> TSL helper function

---

## Phase 2: Component & Cleanup

### Component updates
- **`src/components/postprocessing/post-processing.tsx`** — Uniform updates to TSL nodes
- **`src/components/loading/loading-scene/index.tsx`** — FBO usage updates
- **`src/components/godrays/index.tsx`** — Uniform manipulation to TSL nodes
- **`src/components/arcade-screen/index.tsx`** — Material creation updates
- **`src/components/map/index.tsx`** — Material swapping updates

### Config cleanup
- **`next.config.ts`** — Remove GLSL webpack/turbopack loader rules

### Dependency cleanup
- Remove `raw-loader`, `glslify-loader` from devDependencies
- Remove `glsl-noise` (replace with TSL noise functions like `mx_noise_float()`)

---

## Risks

1. **WebGPURenderer GLSL compat layer** may not handle all GLSL features (especially `RawShaderMaterial` with `GLSL3`). Test Phase 0 thoroughly before proceeding.
2. **Instanced skinned mesh** uses `ShaderChunk` patching which has no direct TSL equivalent. May need a custom TSL node or a different instancing approach.
3. **Offscreen canvas** (`@react-three/offscreen`) WebGPU support is untested.
4. **Browser support** — WebGPU requires Chrome 113+, Edge 113+, Firefox behind flag, no Safari. Need a fallback strategy or accept limited browser support.
5. **`glsl-noise`** dependency used in flow shader. TSL has built-in noise via MaterialX nodes (`mx_noise_float`, `mx_fractal_noise_float`), but output may differ visually.
