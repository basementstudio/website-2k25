# Performance follow-up

> Historical snapshot evidence: the production WebGL loading worker was restored after these measurements. The reported timings, shared-canvas/SVG behavior and handoff validations are not measurements of the current worker revision. See [migration.md](migration.md) for the active architecture and remaining release checks.

The five changes improve asset discovery, reuse renderer preparation, pause hidden HTML videos, consolidate identical texture URLs, and remove allocations from animation loops. Rendering resolution, render-target formats, MSAA, bloom, texture settings, and animation durations remain intact. The backend rollout gate and Sanity caching conventions remain intact.

## Implementation

- `assets:dependencies` generates the base mesh inventory from existing GLB node names. `entryAssetDependencies()` selects the actual entry scene's lighting and image dependencies. Office and routing downloads start after the loader's first frame. Once the main scene module mounts, its model loaders and the lighting/image hints start together. This avoids making the scene JavaScript compete with speculative texture downloads. Request settings match the loaders; destination-only assets remain deferred.
- Each renderer owns a preparation queue and uploaded-texture cache. Overlapping mesh/pass requests share work; completed signatures skip unchanged resources. Navigation takes priority over idle preparation. Resource revisions are separate from video readiness, and renderer disposal retires the queue. Pass signatures preserve color/depth formats and target/renderer sample counts, consistent with [Three's preparation requirements](https://threejs.org/docs/pages/Renderer.html). Preparation retains browser yields, using `scheduler.yield()` with a timer fallback. While WebGL preparation is pending, a scoped animation-frame callback submits queued commands with `flush()`. This prevents asynchronous compilation from waiting for another scene draw when the loader is static. The callback stops on completion or disposal; WebGPU keeps its normal submission path. This follows [WebGL's command-submission guidance](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#flush_when_expecting_results).
- Native and Mux videos share playback reconciliation. Hover state, explicit activity, viewport visibility, document visibility, and current readiness determine playback. Late `play()` resolutions cannot restart an inactive preview. Gallery videos and native videos use the existing 400 px near-viewport loading pattern. Blog native embeds also use this playback controller and metadata-only preload; their existing intrinsic sizing is retained because legacy embeds have no declared dimensions. Posters, sizing, source resolution, mute/loop settings, and visible playback remain as configured.
- Eleven redundant matcap URLs now point to three existing, byte-identical files. The old files remain available. Per-mesh configuration is unchanged.
- Material animation iterates the registry directly and reads shared fade state once per frame. Pet colors use `setRGB()` on their existing color objects. Per-material time accumulation remains unchanged.

The benchmark debug handle also follows the committed React scene. React Suspense can discard an attempted scene while retaining its renderer; the former debug handle then pointed feature tests at a stale scene. This change affects development/benchmark inspection only.

## Measurement conditions

These comparisons use a fresh production baseline captured at the implementation starting point, rather than treating the two supplied migration reports as measurements of the current source.

- Node 24.20.0; Chromium 151.0.7922.34; Apple M5 Max, macOS Darwin 25.6.0.
- Real Apple GPU/Metal adapter; software/fallback adapters rejected.
- 1440 × 900 viewport, device pixel ratio 1; unchanged application quality settings and no sample-count override.
- 80 ms emulated network latency, 1,250,000 bytes/sec throughput (10 Mbps).
- Five new-context cold loads and five same-context warm reloads for Home, Services, and People on both builds and both backends. WebGL2 uses a fresh browser for each build/route pair and alternates before/after order across trials, interleaving the builds. WebGPU uses sequential matrices, plus five additional cold/warm People trials on each build to check borderline frame pacing. All samples are retained: 140 valid timing trials across the two builds.
- Fixed date, weather, and random seed. Timed startup uses reduced motion to separate preparation from the loader fade. Normal-motion handoff checks separately verify the approximately 700 ms fade.
- Rendered-frame p95 is measured over five seconds after ten seconds of settling, using actual renderer frame timestamps. It is not field INP or GPU execution time.
- Runs are sequential. The harness discards a cold/warm pair if another automated graphics browser or Next build overlaps it. This cannot eliminate every source of operating-system or user-application load.

The baseline source manifest SHA-256 is `5be4ce22cf433019173e974e07c1e7e13eaa8fe08192d821dc439a444596e78f`. The final candidate is build `wVG1-ly4AoLWHwzIcdptj`, source manifest SHA-256 `9a156fbeab77d1570fd5b8d9b085b705c2cbcdba0f1734656059e90012e8623b`. The earlier candidate, build `c27b0P6TvLjJTOKwSWrfu`, remains available for the rejected initial comparisons. The manifests hash the sorted path-to-SHA-256 mapping and are retained in `.context/performance/`.

Other authorized work in this shared workspace changed the loader to precomputed geometry/SVG and adjusted missing-page handling during this implementation. The frozen candidate includes that integration. Whole-page loading differences therefore cannot be attributed solely to this follow-up's five changes. Direct renderer-call and texture-request comparisons provide narrower evidence.

## Results

The completed timing comparisons pass all 5% limits. Across the twelve route/cache/backend cells, the largest median loading increase is 1.3%; warm WebGL2 Home improves from 3.43 s to 2.69 s (21.6%). Functional checks and the inspected visual comparisons pass on both backends. The earlier comparisons did not satisfy every 5% limit and are retained as diagnostics. In particular, the scheduled candidate's interleaved WebGL2 matrix had a Services cold median of 13.48 s versus 12.25 s (+10.1%), while its other five cells passed.

Request traces prompted moving texture hints to the scene module's mount. A subsequent renderer profile found the same 182 initial Services compile calls on both builds, but approximately 1.15 s versus 0.61 s inside the asynchronous API. A scoped WebGL command-submission experiment reduced that to 0.63 s and brought handoff close to baseline. The production implementation includes that scoped submission. The full repeated comparison uses the frozen production build; the single profiles above explain the diagnosis separately from that gate.

| Backend | Entry    | Cache | Median load, before → after | Change | Median trial frame p95, before → after | Change | Gate |
| ------- | -------- | ----- | --------------------------: | -----: | -------------------------------------: | -----: | ---- |
| webgpu  | Home     | cold  |           12.192 → 12.154 s |  -0.3% |                         9.70 → 9.40 ms |  -3.1% | Pass |
| webgpu  | Home     | warm  |             2.218 → 2.169 s |  -2.2% |                         9.70 → 9.70 ms |  +0.0% | Pass |
| webgpu  | Services | cold  |           11.876 → 12.026 s |  +1.3% |                         9.70 → 9.80 ms |  +1.0% | Pass |
| webgpu  | Services | warm  |             1.990 → 1.974 s |  -0.8% |                         9.80 → 9.70 ms |  -1.0% | Pass |
| webgpu  | People   | cold  |           11.506 → 11.570 s |  +0.6% |                        10.00 → 9.50 ms |  -5.0% | Pass |
| webgpu  | People   | warm  |             2.167 → 2.129 s |  -1.8% |                         9.65 → 9.35 ms |  -3.1% | Pass |
| webgl2  | Services | cold  |           12.279 → 12.420 s |  +1.1% |                         9.70 → 9.50 ms |  -2.1% | Pass |
| webgl2  | Services | warm  |             2.363 → 2.379 s |  +0.7% |                         9.70 → 9.80 ms |  +1.0% | Pass |
| webgl2  | Home     | cold  |           12.679 → 12.714 s |  +0.3% |                         9.60 → 9.60 ms |  +0.0% | Pass |
| webgl2  | Home     | warm  |             3.433 → 2.693 s | -21.6% |                         9.70 → 9.60 ms |  -1.0% | Pass |
| webgl2  | People   | cold  |           11.957 → 12.043 s |  +0.7% |                         9.80 → 9.70 ms |  -1.0% | Pass |
| webgl2  | People   | warm  |             2.587 → 2.596 s |  +0.4% |                         9.70 → 9.80 ms |  +1.0% | Pass |

One warm WebGPU People trial timed out waiting for the readiness marker without a JavaScript error. Its cold/warm pair is retained as rejected records, and a successful replacement pair restores the planned sample counts. The Mac power log records sleep/wake activity during the affected run (05:24–05:40 UTC), consistent with an environmental interruption. The valid medians pass; the excluded pair and filtered power events remain available for review.

Cold WebGPU request medians show earlier lighting discovery and fewer matcap downloads:

| Cold entry | Base lighting request start, before → after | Unique matcap requests, before → after | Matcap body bytes saved |
| ---------- | ------------------------------------------: | -------------------------------------: | ----------------------: |
| Home       |                               7.04 → 3.53 s |                                  7 → 3 |                  19,184 |
| Services   |                               6.91 → 3.47 s |                                  5 → 2 |                  27,206 |
| People     |                               6.41 → 3.49 s |                                  2 → 1 |                   5,062 |

WebGL2 shows the same request-count reductions, with base lighting starting at 3.45–3.56 s instead of 6.41–7.02 s. The 70 valid candidate loads contain no duplicate static-asset downloads, confirming preload reuse; video range requests are counted separately.

The full asset set contains eleven redundant matcaps totaling 66,638 bytes; that is not a saving on every page. SHA-256 checks confirm every alias is byte-identical and every per-mesh setting is preserved. Existing files remain available for compatibility.

| Backend | Phase    | Compile calls, before → after | Texture init calls, before → after | Sum of async compile API elapsed, before → after |
| ------- | -------- | ----------------------------: | ---------------------------------: | -----------------------------------------------: |
| webgpu  | handoff  |                     394 → 394 |                          212 → 105 |                                     448 → 458 ms |
| webgpu  | idle     |                    2258 → 914 |                         1180 → 135 |                                     610 → 589 ms |
| webgpu  | services |                    2494 → 914 |                         1310 → 135 |                                     641 → 589 ms |
| webgl2  | handoff  |                     394 → 394 |                          212 → 105 |                                     926 → 914 ms |
| webgl2  | idle     |                    2258 → 914 |                         1180 → 135 |                                   1077 → 1045 ms |
| webgl2  | services |                    2494 → 914 |                         1309 → 135 |                                   1093 → 1045 ms |

Cumulative compile calls after idle preparation fall from 2,258 to 914 on both backends (59.5% fewer calls). Subsequent Home → Services navigation adds zero compile or texture-init calls, versus 236 compile calls and approximately 130 texture-init calls before. These are API-call reductions; Three also skips unchanged textures internally, so texture-init counts do not equal GPU uploads.

Preparation profiles report cumulative renderer calls at handoff, after idle preparation, and after Home → Services navigation. The sum of asynchronous API durations is neither CPU time nor GPU execution time. Loader fade and visible handoff are measured separately.

Two navigation laps cover Services, People, Blog, Lab, and Home. Every paired camera endpoint matches exactly across the twenty transitions, with no runtime errors. Per-transition p95 intervals remain within 5% of baseline.

| Backend | Transition frame p95 range, before → after | Largest observed frame interval, before → after |
| ------- | -----------------------------------------: | ----------------------------------------------: |
| webgpu  |                     9.8–10.0 → 9.8–10.1 ms |                                  28.4 → 29.7 ms |
| webgl2  |                     9.8–10.1 → 9.8–10.2 ms |                                  28.9 → 30.8 ms |

The largest individual intervals are slightly higher; these traces establish preserved p95 pacing, not an improvement in worst-case navigation stalls.

## Validation

- All 17 graphics regression tests pass under Node 24, including dependency selection, queue coalescing/priority/cancellation/retry/invalidation, renderer replacement, and playback intent after delayed readiness.
- TypeScript, targeted ESLint/Prettier, asset verification, Basis consistency checks, and the production build pass. Asset verification reports the eleven intentionally retained, now-unreferenced compatibility files.
- Repository-wide lint still reports 21 existing formatting errors in `sanity/schemas/singletons/scenesConfig.ts` and four existing effect-cleanup warnings. Those unrelated lint issues remain outside this follow-up.
- Both backends pass all nine canvas routes, persistent navigation, repeated contact open/close with form-state preservation, resize, renderer/context recovery, worker cleanup, and second-failure HTML fallback. No contact form was submitted.
- Both backends pass weather/rain, inspectable reveal/drag/close, arcade screen controls and gameplay/HUD, basketball drag/release, and hidden-scene pause/resume checks.
- CCTV passes Home display, offscreen pause, and direct missing-page entry on both backends.
- Media checks cover leaving before native/Mux readiness, disabling a preview, viewport exit/re-entry, native gallery deferral, and gallery row/grid changes. HTML hidden-tab checks simulate `document.hidden` and `visibilitychange`; they are not an OS-level tab-switch test.
- Delayed character-model and visible-video checks retain the complete-entry reveal gate on both backends. Normal motion retains the fade; reduced motion skips it.

Fixed-condition Home, People, and Services/weather screenshots have been inspected. Layout, lighting, texture detail, sharpness, and bloom are preserved. Randomized character selection, traffic positions, and video frames can differ despite a fixed seed because asynchronous loading changes the order in which random values are consumed. Camera-travel recordings were collected separately from timing measurements; inspected keyframes preserve the scene appearance. Loader reveal, inspectables, weather, arcade gameplay, CCTV, and contact/recovery captures were also inspected. Detailed review notes identify the exact files and the limits of frame-by-frame comparison.

Selected visual comparisons: [Home before](evidence/performance/home-before.png) / [after](evidence/performance/home-after.png), and [contact after recovery before](evidence/performance/contact-recovered-before.png) / [after](evidence/performance/contact-recovered-after.png).

This is desktop Chromium validation on one Mac. It does not establish physical Windows/Android/iPhone performance or field responsiveness.

## Reproduction and local artifacts

Use Node 24. Production comparisons use separately frozen builds. The baseline is `.context/performance/baseline` on port 3201; the final candidate is `.context/performance/submission-candidate` on port 3205. Both use `NEXT_PUBLIC_GRAPHICS_BACKEND=auto NEXT_PUBLIC_GRAPHICS_BENCHMARK=1` for local backend selection and instrumentation. The application's rollout gate is unchanged.

```sh
pnpm graphics:test
pnpm exec tsc --noEmit
pnpm assets:verify
pnpm basis:check
pnpm build

# CHROME_PATH must select the installed hardware-enabled Chromium executable.
QUIET=1 TRIALS=5 RESULTS_DIR=.context/performance/new-before-webgpu \
  node scripts/graphics/benchmark.mjs http://localhost:3201 webgpu
QUIET=1 TRIALS=5 RESULTS_DIR=.context/performance/new-after-webgpu \
  node scripts/graphics/benchmark.mjs http://localhost:3205 webgpu
node scripts/graphics/compare.mjs \
  .context/performance/new-before-webgpu/results.json \
  .context/performance/new-after-webgpu/results.json \
  .context/performance/new-compare-webgpu.json
```

For the interleaved WebGL2 method, run one cold/warm pair per fresh browser with `TRIALS=1 ROUTES=<route>`, alternating build order across five trials for each route, then combine the records by build before comparison. The exact local driver is `.context/performance/run-submission-paired-webgl2.mjs`. `compare.mjs` requires at least five valid trials in every cell and fails if any median loading or median trial p95 frame interval exceeds its baseline by more than 5%.

Compact review evidence is retained in [evidence/performance](evidence/performance/), including final comparisons, raw timing reports, validation outcomes, byte-identity checks, and source manifests. Earlier failed comparisons are marked separately. Detailed traces remain in `.context/performance/`: `submission-paired-webgl2-*`, `after-submission-webgpu*`, `preparation-final-*`, `navigation-final-*`, `travel-final-*`, `smoke-review-*`, `features-scheduled-*`, `media-final`, `handoff-final`, and `contact-visual-final`. CCTV evidence is `.context/cctv-check/results.json`. Build, type, lint, and test logs are in the same performance directory.
