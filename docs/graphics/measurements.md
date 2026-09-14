# Graphics measurements

> Historical snapshot evidence: the production WebGL loading worker was restored after these measurements. The reported timings, shared-canvas/SVG behavior and handoff validations are not measurements of the current worker revision. See [migration.md](migration.md) for the active architecture and remaining release checks.

This report compares the migrated production build with the live `https://basement.studio` site and a preserved local build of `origin/main` at `9db5c2ed799f3ff4bd1952456a492c2fdedfbd2b`. It does not certify the full release gate.

The loading results below were captured **before the subsequent loader-handoff change**. The current implementation waits for characters, pets, visible screen content and route-specific startup resources, then crossfades for 700 ms (without animation for reduced motion). Its first-frame mark now records the completed handoff. The previous timing and byte improvements must not be presented as measurements of this newer readiness policy; repeat the loading comparison before release. The [handoff validation record](evidence/handoff-validation.json) identifies the updated build. Its [handoff checks](evidence/handoff.json) verify delayed models/video and reduced motion on both backends; [loading](evidence/handoff-loading.png), [crossfade](evidence/handoff-fading.png) and [ready](evidence/handoff-ready.png) images show the updated sequence.

The latest loader-first revision uses production’s wireframe geometry, prepared offline, with vector outlines in the initial HTML and no opening caption or screenshot. [First-paint checks](evidence/instant-loader.json) pass with JavaScript disabled on desktop, mobile and a missing route, and with GPU initialization deliberately held. [Handoff checks](evidence/instant-handoff.json) preserve complete-entry readiness on both backends. [Desktop first paint](evidence/instant-loader-desktop.png), [mobile first paint](evidence/instant-loader-mobile.png) and [crossfade](evidence/instant-loader-fading.png) show this revision. The [validation record](evidence/instant-validation.json) identifies the tested builds, route/recovery checks and a concurrent diagnostic-only workspace edit. These are functional checks; their unthrottled, deliberately delayed timings are not comparative performance benchmarks.

## Results

Three cold and three warm trials per route on the Apple M5 Max, at 1440 × 900 / DPR 1 and a 10 Mbps throttle. Values below are medians; all final trials completed without recorded runtime errors.

| Cold scene handoff | Live production |  WebGPU | Forced WebGL2 | WebGPU improvement |
| ------------------ | --------------: | ------: | ------------: | -----------------: |
| Home               |         13.79 s | 10.13 s |       10.65 s |              26.5% |
| Services           |         13.72 s |  9.93 s |       10.10 s |              27.6% |
| People             |         13.83 s |  9.53 s |        9.79 s |              31.1% |

| Warm scene handoff | Live production | WebGPU | Forced WebGL2 |
| ------------------ | --------------: | -----: | ------------: |
| Home               |          2.22 s | 1.58 s |        2.67 s |
| Services           |          2.18 s | 1.47 s |        1.65 s |
| People             |          2.23 s | 1.55 s |        1.82 s |

| Initial home resources                                 | Live production |  WebGPU | Forced WebGL2 |
| ------------------------------------------------------ | --------------: | ------: | ------------: |
| Completed page-observed 3D bodies                      |        11.89 MB | 8.58 MB |       8.71 MB |
| Observed 3D network bytes, including partial transfers |        12.28 MB | 8.77 MB |       9.25 MB |

WebGPU reduces completed initial home 3D body bytes by **27.8%**. MB uses decimal units. The byte measures have the page/worker and detection limits described below.

| p95 rendered-frame interval, default quality | Production (no scene MSAA) | WebGPU (4× MSAA) | WebGL2 (4× MSAA) |
| -------------------------------------------- | -------------------------: | ---------------: | ---------------: |
| Home                                         |                    9.40 ms |          9.40 ms |          9.30 ms |
| Services                                     |                    9.50 ms |          9.70 ms |          9.30 ms |
| People                                       |                    9.30 ms |          9.30 ms |          9.20 ms |

The extra scene antialiasing makes that default-quality table an experience comparison, not an isolated API comparison. A separate Services control disables scene MSAA before target preparation, while retaining the same shaders, content and resolution:

| Services p95, no scene MSAA | Live production | WebGPU control | WebGL2 control |
| --------------------------- | --------------: | -------------: | -------------: |
| Frame interval              |         9.50 ms |        9.80 ms |        9.70 ms |

| Preserved local original: cold handoff | Original WebGL | Migrated WebGPU | Improvement |
| -------------------------------------- | -------------: | --------------: | ----------: |
| Home                                   |        13.66 s |         10.13 s |       25.8% |
| Services                               |        13.62 s |          9.93 s |       27.1% |
| People                                 |        13.62 s |          9.53 s |       30.0% |

Raw reports: [production](evidence/production.json), [original local build](evidence/original.json), [WebGPU](evidence/webgpu.json), [WebGL2](evidence/webgl2.json), [WebGPU control](evidence/webgpu-matched.json), [WebGL2 control](evidence/webgl2-matched.json). The [build record](evidence/build.json) identifies the measured app sources.

Reference images: [production home](evidence/production-home.png) / [WebGPU home](evidence/webgpu-home.png), [production Services](evidence/production-services.png) / [WebGPU Services](evidence/webgpu-services.png), [production People](evidence/production-people.png) / [WebGPU People](evidence/webgpu-people.png), [restored loader](evidence/loader-webgpu.png).

## Navigation

| First-visit camera trace: largest frame interval | Live production | Final WebGPU |
| ------------------------------------------------ | --------------: | -----------: |
| Services                                         |         25.5 ms |      28.0 ms |
| People                                           |         17.0 ms |      18.9 ms |
| Blog                                             |         15.9 ms |      17.2 ms |

These are single fixed interaction traces at DPR 1, with CPU profiling enabled, and include the first audio activation. They are not repeated-trial medians. [Production trace](evidence/navigation-production.json), [final WebGPU trace](evidence/navigation-comparison.json).

Earlier matching DPR-1.5 traces also measured a substantial improvement in navigation-start-to-0.2-world-unit movement after destination and audio preparation. Their raw movement thresholds include Playwright click actionability overhead and camera easing; they are not INP. [Before](evidence/navigation-before.json), [after audio preparation](evidence/navigation-audio.json).

## Interpretation and remaining work

- The 20% cold-loading and 25% initial-home-byte targets are met in this three-trial Apple Silicon comparison against live production. The preserved local original shows similar gains, so the improvement is not explained solely by CDN versus localhost delivery.
- Default-quality median p95 frame intervals stay within 5% of production on these three routes. The Services control with MSAA matched is also within 5%. Disabling MSAA did not show a consistent pacing advantage here, so the quality improvement remains enabled. These short runs are close to the 120 Hz refresh ceiling and do not establish GPU execution-time savings.
- **Forced-WebGL2 warm home loading remains a regression: 2.67 s versus 2.22 s, about 0.45 s / 20% slower.** Its cold loading and the other warm routes improved. Warm fallback initialization remains a tuning item.
- Final camera pacing is comparable to production, rather than consistently faster. The earlier migration's large first-click hitch was reduced through asset/pipeline preparation and idle audio-context setup; the final first-Services peak is 28.0 ms versus production's 25.5 ms in the same DPR-1 trace.
- Windows/iPhone/Android, longer thermal runs, five-or-more-trial repetition, field INP and final visual sign-off remain release gates. WebGPU is still opt-in at build time.

## Method

- Apple M5 Max, macOS/Darwin 25.6.0; the same Chromium executable for each comparison. Actual application WebGL contexts identify the Apple M5 Max through ANGLE Metal. WebGPU identifies Apple/Metal and a non-fallback adapter. An initial pilot without verified GPU metadata was discarded.
- Production builds, 1440 × 900 viewport, device DPR 1 for loading comparisons. The migrated WebGPU and forced-WebGL2 builds share the same code and effects; adaptive quality is disabled by the benchmark flag.
- Three fresh-browser-context cold trials per route, each followed by a same-context warm navigation. Home, Services and People are measured. The preserved original additionally receives three cold trials per route. Browser/driver shader caches may persist across contexts; “cold” describes the page's HTTP/application cache, not a rebooted driver.
- CDP adds 80 ms latency and caps throughput at 10 Mbps. The live site's real network/CDN latency remains additional to this throttle; localhost has different compression/caching/server overhead. Document TTFB is recorded. The preserved local original helps distinguish delivery differences from application changes.
- Fixed viewport, wall-clock time, random seed, weather response and reduced-motion setting. Model asset hashes on production match the original model bundle names, but live Sanity content is not a pinned snapshot. Deferred loading changes random-call order, so character selection can differ.
- Startup uses the legacy loader's completion message versus the migrated renderer's first main-scene submission mark. These approximate the visible/interactive handoff; they are not hardware presentation timestamps. The old loader's reveal delay is included.
- Initial bytes cover completed `/3d/` resources recorded on the page before that mark. Encoded body sizes, decoded body sizes and transfer sizes are retained separately. CDP also records network bytes observed at detection, including partial transfers; detection can trail the mark. Worker-only resource timing is not comprehensively included. These are browser observations, not total wire captures.
- Frame pacing: ten seconds after startup, capture five seconds of actual rendered-frame intervals. Legacy instrumentation detects the first WebGL draw in each animation frame; migration diagnostics record final-pass submission. These are application pacing intervals, not GPU execution time. A fast 120 Hz desktop ceiling can conceal remaining GPU headroom differences.
- The migration adds 4× scene MSAA; the original local renderer's main target has no MSAA. Its half-float format, bloom and final treatment otherwise remain comparable. Therefore original-versus-migration measurements describe the resulting experience, not an isolated matched-effects rendering API experiment. The two migrated backends match each other.

A forced-WebGL2 run was interrupted by macOS sleep/network loss and timed out; it was excluded in full and repeated. Subsequent comparisons use a process-scoped `caffeinate -dis` assertion.

## Validation

Production build and prerendered routes pass, as do TypeScript, seven graphics regression tests, asset verification, Basis consistency and deterministic shader regeneration. Full lint still reports 21 pre-existing formatting errors in unchanged `sanity/schemas/singletons/scenesConfig.ts`, plus four existing ref-cleanup warnings; changed graphics code passes targeted lint.

Chromium WebGPU/forced-WebGL2 route and feature checks cover all canvas routes, inspectables, weather, arcade gameplay/HUD, basketball, Doom display and pause/resume. Recovery/contact traces pass on Chromium and Firefox, including old decoder-worker termination and stable worker counts across contact reopening. Fault checks, loader checks, audio activation and visible/offscreen CCTV checks are recorded alongside their raw results. The [validation record](evidence/validation.json) links these checks and lists the remaining release gates.

## Limits and rollout

Windows integrated graphics, iPhone Safari and midrange Android hardware were not available. Real-device HDR fallback, sustained thermal behavior, touch/keyboard visual review and the five-trial release matrix remain open. Lab LCP/CLS and a scripted interaction trace do not establish field INP or field Core Web Vitals. LCP reflects eligible HTML text/images, not completion of the 3D canvas; scene readiness is measured separately.

WebGPU stays behind `NEXT_PUBLIC_GRAPHICS_BACKEND=auto`; production's default remains the new WebGL2 fallback renderer until the release requirements pass. Local development on port 3000 uses WebGPU first.
