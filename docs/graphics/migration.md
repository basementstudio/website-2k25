# Graphics migration and release gate

The main and contact renderers use Three r186 `WebGPURenderer`, Fiber's asynchronous `gl` factory, and shared TSL materials on WebGPU and WebGL2. HTML routes, Sanity fetch/cache/webhook behavior, forms, and SEO retain their existing paths. Vercel analytics scripts mount on Vercel deployments only, where their platform endpoints exist.

**WebGPU is not enabled by default.** The production default is WebGL2 through the new node renderer. Build with `NEXT_PUBLIC_GRAPHICS_BACKEND=auto` to try WebGPU first. Keep this gate until the physical-device matrix and visual review below pass. To force WebGL2 at build time, set `NEXT_PUBLIC_GRAPHICS_BACKEND=webgl2` (or omit the variable).

## Architecture

- `src/lib/graphics/renderer.ts` owns initialization, backend reporting, error/device-loss handling, and disposal. Main-scene recovery replaces the canvas once and rebuilds renderer-owned resources using WebGL2. A second failure exposes the HTML experience. Generation checks ignore late failures from retired renderers. `RendererLifetime` explicitly disposes the renderer on a real unmount (Fiber does not do this), while canceling disposal during Strict Mode effect replay.
- `src/lib/graphics/material.ts` provides mutable node-material controls. The baked-lighting and batched character vertex/fragment graphs are TSL. Screen, CRT, bloom, grading, weather/sky, steam and routing fragment graphs are generated **offline** from their GLSL math with Three's transpiler. The transpiler runs offline; the main/contact node materials do not use runtime GLSL. The retained loading worker still uses its original GLSL materials. Run `pnpm graphics:generate` after editing those source shaders; generation currently needs `clang`.
- The main scene uses a multisampled half-float target, optional half-resolution bloom, and Three's `RenderPipeline`. Linear intermediate passes receive exactly one final output conversion. CCTV and arcade passes preserve target state and release their resources. A visible CCTV screen prepares its feed incrementally after scene entry; direct 404 entry prepares it before reveal. New asset groups invalidate that preparation, and offscreen feeds pause. Sky/bloom explicitly account for node-render-target coordinates.
- Contact creates its canvas on first opening, uses typed callbacks for animation/screen projection, preserves the form across renderer replacement, and pauses the covered main scene. The contact rendering worker and UIKit have been removed. The production wireframe loader remains a separate WebGL/offscreen worker and canvas; its worker is terminated on handoff or unmount. Decoder workers and the external Doom engine worker remain.
- Renderer-scoped GLTF/KTX2 caches prevent decoded/compressed resources crossing backend recovery. Encoded KTX2 buffers are isolated before parsing so Three's global buffer-keyed transcode cache cannot reuse a retired worker task or a texture prepared for another backend. Renderer-owned loading managers abort pending model/texture downloads at disposal. Draco/Basis pools have two workers each. Parsed assets, render targets, video textures and batched animation textures are disposed with their owner, including downloads completing after disposal.

## Loading and quality

The active loader is production’s original WebGL scene in `loading-worker.tsx`, mounted through `@react-three/offscreen`. It loads the original office wireframe model and receives camera configuration from the navigation store. Main-scene modules and preloads wait for its ready message, or proceed when the loader reports failure. Entry geometry, lighting, characters, pets, details, visible video frames and route-specific physics/arcade/Doom content must be ready before the main passes warm. The worker then owns the reveal animation and reports completion before the loader is removed. A slow-loading deadline never forces a partial scene into view. If a navigation link hydrates before the scene configuration, it uses the HTML router immediately.

This worker restoration supersedes the earlier shared-renderer TSL/SVG loader prototype. `wireframe-loader.tsx`, its offline geometry generator and outline assets remain in the repository as prototype work; they are not mounted by the current scene. The active worker path has no visible HTML fallback before initialization. First-paint behavior, reduced motion, loading performance and worker recovery need fresh verification before release. The earlier 700 ms shared-canvas fade and no-JavaScript SVG checks do not validate this worker revision.

There is no “Opening the basement” caption or opening screenshot: the public poster assets and manifest have been removed. Reference images exist only in the measurement evidence.

`pnpm assets:split-scenes` partitions the original office-items GLB into shared, showcase/home, services, people and blog groups. It copies geometry bytes without recompression, preserving node names, hierarchy and transforms. Unit tests validate every original node and geometry buffer against the partitions. The original bundle remains the offline source. Shared office/environment geometry remains a common group; route props and their lightmaps/AO/reflections load independently. Destination groups are prepared before the camera moves. Hover, focus and touch-down signal destination intent. After the first entry frame, desktop idle time prepares one destination at a time; this is disabled on mobile, data-saving/slow connections, hidden tabs, contact overlays and camera transitions. Material work yields between small batches and also warms base-office meshes seen along camera paths. Static textures upload during this preparation, and resolved KTX2 arrays retain their identity to avoid repeated bake setup.

Characters, inspectable overlays, pets and particles prepare behind the loader after base geometry and lighting are ready. Their committed resources participate in the entry readiness check. Physics, arcade content/game assets, contact and Doom initialize when needed. Screen videos start when visible and pause when hidden or covered. The global texture readiness gate is gone; the separate production loading worker remains. Static character placements avoid repeated transform decomposition and GPU matrix uploads; animation keyframes upload only when they change. Camera movement uses elapsed frame time without the physics delta clamp. A suspended audio context prepares during idle time after the first scene appears; the first user gesture resumes it, moving costly device creation away from the navigation click while keeping audio downloads and playback deferred.

Desktop starts at DPR ≤1.5, mobile at 1. Adaptive quality measures sustained frame windows, reduces optional effects before resolution, and probes desktop DPR up to 2. Asymmetric thresholds, a cooldown and a learned resolution ceiling prevent rapid oscillation. Resolution increases require measured headroom and are suspended during camera transitions. The 4× scene MSAA occurs before intentional pixelation/CRT treatment; half-float intermediates and filtered minification reduce unintended banding and shimmer.

## Reproducing measurements

Use Node 24 and the locked dependencies. Keep the original production build, dependencies and public assets in a separate directory before building the migration. Both servers must use the same Sanity content snapshot/environment. Do not run the comparison against `next dev`.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium firefox
NEXT_PUBLIC_GRAPHICS_BACKEND=auto NEXT_PUBLIC_GRAPHICS_BENCHMARK=1 pnpm build
pnpm start --port 3103
# In another terminal, with the preserved baseline served on port 3102:
pnpm graphics:benchmark http://localhost:3102 legacy
pnpm graphics:benchmark http://localhost:3103 webgpu
pnpm graphics:benchmark http://localhost:3103 webgl2
```

The benchmark flag disables adaptation, enables bounded diagnostic capture, and allows `?backend=webgl2`. Never use it for a normal release. `CHROME_PATH` selects a particular browser executable; `TRIALS` defaults to 5, `WARM=0` skips warm trials, `ROUTES` accepts a comma-separated subset, and `RESULTS_DIR` selects the output directory. `SCENE_SAMPLES=0` applies a diagnostic-only override before target preparation, matching the original renderer's lack of MSAA; use a distinct label such as `webgpu-matched` and retain the recorded overrides. On macOS, `caffeinate -dis` around a benchmark prevents idle sleep from invalidating the run.

The harness fixes viewport/DPR, reduced motion, weather, wall-clock time and random seed; applies 80 ms latency and 10 Mbps throughput; and records cold/warm loads, initial completed 3D resource sizes/transfers, LCP/CLS, screenshots and five-second rendered-frame intervals after ten seconds of warmup. Frame intervals measure application pacing, **not GPU execution timestamps**. Seeded character selection can differ between implementations because their random-call order differs; inspect those regions as animated content rather than a pixel-exact diff. The report records actual application WebGL context/GPU settings, WebGPU adapter requests, canvas dimensions and document TTFB. The report includes both completed Resource Timing body sizes and CDP network bytes observed at first-frame detection, including partial transfers. CDP observation can trail the frame mark slightly; these are browser-level measurements rather than wire captures. Lab measurements do not replace field INP/LCP/CLS or sustained mobile thermal testing.

```sh
pnpm graphics:test
pnpm assets:verify
pnpm basis:check
pnpm exec tsc --noEmit
pnpm lint
pnpm graphics:smoke http://localhost:3103
BACKEND=webgl2 pnpm graphics:smoke http://localhost:3103
BROWSER=firefox BACKEND=webgl2 pnpm graphics:smoke http://localhost:3103
node scripts/graphics/faults.mjs http://localhost:3103
node scripts/graphics/features.mjs http://localhost:3103
BACKEND=webgl2 node scripts/graphics/features.mjs http://localhost:3103
node scripts/graphics/not-found.mjs http://localhost:3103
node scripts/graphics/navigation.mjs http://localhost:3103 navigation
node scripts/graphics/audio.mjs http://localhost:3103
BROWSER=firefox node scripts/graphics/audio.mjs http://localhost:3103
node scripts/graphics/cctv.mjs http://localhost:3103
```

The smoke trace covers direct canvas routes, persistent navigation, contact reopening/form retention, resize, first recovery and terminal fallback. Fault scenarios inject delayed initialization, adapter rejection, failure of both backends, missing models and recovery during a pending model download. Feature traces cover weather toggling, inspectable reveal/dragging, arcade UV buttons and keyboard gameplay/HUD, basketball dragging and hidden-scene pause/resume. Unmatched URLs use the root `not-found.tsx` with the existing site layout and CCTV UI, preserving HTTP 404/noindex. Returning home from this root error tree uses a document navigation so Next’s cached error layout cannot retain a second canvas; regular canvas routes and the explicit `/404` route keep their existing transitions. The not-found trace verifies HTTP status, live rendering and one canvas after returning home on both backends. The `instant-loader.mjs`, `loader.mjs` and `handoff.mjs` scripts describe the superseded SVG/shared-canvas prototype and require updates before they can certify the current worker loader. Navigation traces capture first/repeated movement, rendered-frame intervals and CPU profiles at fixed desktop resolution. Audio checks verify idle preparation and early interaction; CCTV checks verify visible updates, offscreen suspension and direct 404 entry on both backends. No contact form or leaderboard submission is performed.

## Release requirements still needing physical-device evidence

- Five or more cold/warm trials and identical interaction traces on Apple Silicon, Windows integrated graphics, iPhone Safari and midrange Android Chrome; include Firefox and forced WebGL2.
- Median first interactive 3D frame at least 20% faster on home/services/people; at least 25% fewer initial home 3D bytes.
- Matched-resolution/effect workloads within 5% of baseline frame timing; slow baseline workloads target a 15% improvement in p95. Check sustained 60 fps desktop/30 fps phone targets and adaptive-quality stability.
- LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1 under the agreed field/network conditions. Navigation must work during initialization.
- Visual sign-off for every route, inspectables, arcade UI/gameplay, basketball, Doom display, weather, character animation, reduced motion, touch/keyboard, resize and background/resume.
- Native BC-capable hardware and devices lacking compressed HDR support: validate lightmaps and the uncompressed fallback with the synchronized Basis transcoder.
- Repeated navigation/contact/recovery with no accumulated canvases, workers or GPU resources. Heap/resource counters alone do not prove driver-level memory reclamation.

Physical Windows/iPhone/Android devices are not available in this workspace; their release gates cannot be certified by browser viewport emulation. Results and local limitations are recorded in `measurements.md`.

References: [WebGPURenderer](https://threejs.org/docs/pages/WebGPURenderer.html), [RenderPipeline](https://threejs.org/docs/pages/RenderPipeline.html).

Primary-source research and implementation decisions: [webgpu-practices.md](webgpu-practices.md).
