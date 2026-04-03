# GPU Performance Optimization for 120fps

## Goal

Eliminate remaining CPU-bound per-frame work by moving computations to the GPU via TSL, and clean up dead code from the WebGL-to-WebGPU migration.

## Steps

### Step 1: CRT Mesh timerLocal()

**File**: `src/components/doom-js/crt-mesh.tsx`

Replace `uTime = uniform(0)` with `timerLocal()` from TSL. Remove the per-frame `uTime.value = state.clock.getElapsedTime()` CPU write. This is safe because CRT mesh uses raw clock time (not pausable).

### Step 2: Postprocessing dead uTime removal

**Files**: `src/shaders/material-postprocessing/index.ts`, `src/components/postprocessing/post-processing.tsx`

The `uTime` uniform is declared and pumped every frame but never referenced in the shader graph. Remove the declaration and the per-frame write.

### Step 3: Arcade grid dead code + TSL distance fade

**File**: `src/components/arcade-game/entities/grid.tsx`

Delete `gridMaterial` (ShaderMaterial with inline GLSL — last remaining raw GLSL in the codebase) and its `useFrameCallback`. This material is dead code — never attached to rendered geometry. Add distance-based opacity fade to the actual `LineMaterial` instances via TSL NodeMaterial approach.

### Step 4: Weather rain UV scroll to TSL

**Files**: `src/shaders/material-global-shader/index.tsx`, `src/components/weather/index.tsx`

Move UV scroll computation from CPU (`Matrix3.setUvTransform()` every frame) into TSL shader graph. Add `uScrollSpeed` and `uRepeat` per-material uniforms. Compute in TSL: `fract(uv().add(vec2(0, uTime.mul(uScrollSpeed))).mul(uRepeat))`. Remove the `useFrameCallback` that does `setUvTransform`.

### Step 5: Christmas tree ornaments to TSL

**Files**: `src/shaders/material-global-shader/index.tsx`, `src/components/christmas-tree/client.tsx`

Move 4-phase sine-based intensity cycling and star hue rotation from CPU to TSL. Add per-material uniforms: `uPhaseOffset` (0-3 for color groups), `uBaseEmissiveIntensity`, `uIsStarMaterial`. Use `timerLocal()` (non-pausable, preserves current always-animating behavior). Remove the entire `useFrame` loop that iterates ornament meshes.

## Verification

After each step: `pnpm tsc --noEmit` + visual check in browser.
