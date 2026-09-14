# WebGPU performance research — 9 September 2026

The useful priorities for this site are reducing first-use work, avoiding redundant uploads, and preserving responsiveness during camera travel. WebGPU alone does not guarantee a faster site. Measurements and limitations are in [measurements.md](measurements.md).

## Practices implemented

| Practice                                       | Application in this migration                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prepare pipelines before first use             | Entry-scene compilation and incremental destination compilation use the actual scene, target format and sample count. Hover/focus/touch intent and eligible desktop idle time prepare destinations before travel.                                                                                               |
| Move texture uploads out of camera movement    | Destination preparation calls `initTexture` for decoded static textures, yielding between small batches. Video and render-target textures retain their own lifecycle.                                                                                                                                           |
| Keep resource identities stable                | Resolved KTX2 arrays keep their identity across unrelated React renders, avoiding repeated bake attachment and preparation. Static character matrices upload only when changed; bone-keyframe textures update only when their animation frame changes.                                                          |
| Bound optional work                            | The restored wireframe loader shares one renderer, caps its target width at 1280, and requests at most 30 fps. CCTV prepares when its screen becomes visible, updates after scene assets change, and pauses offscreen. Arcade/physics/contact initialize when needed; hidden scenes and offscreen videos pause. |
| Avoid repeated UI rasterization                | Arcade panels and HUD use Canvas2D textures, updated when their content changes.                                                                                                                                                                                                                                |
| Prepare audio without blocking the first click | After the first scene appears, eligible idle time creates one suspended audio context. A real click resumes it; early clicks retain immediate initialization. Chromium and Firefox tests verify silence before interaction and reuse of a single context.                                                       |
| Own resources per device                       | Recovery builds a fresh renderer/canvas and renderer-owned compressed textures, decoders and scene resources. Application/form state survives. A failed fallback leaves HTML navigation and contact usable.                                                                                                     |
| Match rendering configuration                  | Both migrated backends use the same node graphs, main target, 4× scene MSAA and postprocessing. Color conversion happens at final output.                                                                                                                                                                       |

Three documents `compileAsync` for avoiding first-use shader stutter and `initTexture` for moving decoding/upload overhead ahead of rendering. Its target-scene requirement matters when warming objects outside their normal render pass. [Three Renderer documentation](https://threejs.org/docs/pages/Renderer.html).

Minimizing unchanged buffer uploads and temporary allocations is a useful first step before introducing custom staging-buffer machinery. This migration keeps Three's upload implementation and reduces the application's redundant updates. [WebGPU buffer upload guidance](https://toji.dev/webgpu-best-practices/buffer-uploads).

Image, canvas and video sources have different upload and lifetime requirements. We keep direct Canvas2D texture updates for the arcade, and exclude dynamic video sources from static texture prewarming. [WebGPU image and video texture guidance](https://toji.dev/webgpu-best-practices/img-textures).

Device loss invalidates resources associated with that device. Recovery is explicit and bounded instead of continually retrying an unavailable backend. [WebGPU device-loss guidance](https://toji.dev/webgpu-best-practices/device-loss).

The navigation CPU profile also found about 101 ms spent creating the audio context during the first click. Moving creation into idle time preserves gesture-based `resume()` and defers sound/graph initialization until interaction. This shifts unavoidable setup away from camera navigation rather than claiming to eliminate its cost. [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).

## Benchmark rules applied

Record the application's actual WebGL renderer/context settings and requested WebGPU adapter; verify hardware acceleration. Match browser, viewport, drawing-buffer size, network throttle and content controls. Compare production builds. Separate loading improvements from rendering API claims, and disclose the live CDN versus localhost difference. [WebGPU/WebGL comparison guidance](https://toji.dev/webgpu-best-practices/webgl-performance-comparison).

The harness measures rendered-frame intervals, not GPU execution time. Optional timestamp queries are a separate diagnostic with browser-dependent precision; they are not enabled in normal releases. [Chrome timestamp-query discussion](https://developer.chrome.com/blog/new-in-webgpu-120).

## Evaluated but deferred

**Render bundles:** valuable when repeated command encoding is the CPU bottleneck; they do not reduce fragment/vertex GPU work. The office has changing visibility, video bindings and inspectable reparenting. Three's static `BundleGroup` caches its render list, so a blanket wrapper would require a deliberate culling/invalidation design. Do not trade correct camera-path visibility for a speculative optimization. A future experiment should isolate immutable opaque groups and measure CPU submission time separately. [Render-bundle guidance](https://toji.dev/webgpu-best-practices/render-bundles.html), [Three BundleGroup](https://threejs.org/docs/pages/BundleGroup.html).

**Custom staging pools, GPU-driven culling and reduced shader precision:** no evidence yet that their additional complexity beats the current targeted fixes on this workload. Profile representative Windows/mobile hardware before adopting them.

**Default WebGPU rollout:** remains gated on the device matrix, visual review and measured release requirements. Local Apple Silicon results cannot establish iPhone, Android or Windows performance.
