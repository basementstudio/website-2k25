/** Runs inside the browser before application modules. Avoid routing: it disables HTTP caching. */
export function freezeEnvironment() {
  let seed = 1234567
  Math.random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const OriginalDate = Date
  window.Date = class extends OriginalDate {
    constructor(...args) {
      super(...(args.length ? args : [1788969600000]))
    }
    static now() {
      return 1788969600000
    }
  }
  const originalFetch = window.fetch
  window.fetch = (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url
    if (new URL(url, location.href).pathname === "/api/weather")
      return Promise.resolve(
        new Response(
          JSON.stringify({
            isRaining: false,
            isThunderstorm: false,
            rainIntensity: 0,
            cloudCover: 0.2,
            windSpeed: 10,
            fetchedAt: 1788969600000
          }),
          { headers: { "Content-Type": "application/json" } }
        )
      )
    return originalFetch(input, init)
  }
}

export function instrumentBrowser() {
  window.__measurement = {
    legacyReady: 0,
    cls: 0,
    lcp: 0,
    interactions: [],
    drawTimes: [],
    capture: false
  }
  // Retain the actual contexts/adapters selected by the application. Querying
  // a new context later could identify a different GPU on dual-GPU laptops.
  window.__measurement.contexts = []
  window.__measurement.adapters = []
  const getContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (...args) {
    const context = getContext.apply(this, args)
    if (
      context &&
      args[0] === "webgl2" &&
      !window.__measurement.contexts.includes(context)
    )
      window.__measurement.contexts.push(context)
    return context
  }
  if (navigator.gpu) {
    const requestAdapter = navigator.gpu.requestAdapter.bind(navigator.gpu)
    navigator.gpu.requestAdapter = async (...args) => {
      const adapter = await requestAdapter(...args)
      if (adapter) {
        const info = adapter.info
        window.__measurement.adapters.push({
          vendor: info.vendor,
          architecture: info.architecture,
          device: info.device,
          description: info.description,
          isFallbackAdapter: info.isFallbackAdapter,
          features: [...adapter.features]
        })
      }
      return adapter
    }
  }
  const WorkerClass = Worker
  window.Worker = class extends WorkerClass {
    constructor(...args) {
      super(...args)
      this.addEventListener("message", (event) => {
        if (event.data?.type === "loading-transition-complete")
          window.__measurement.legacyReady = performance.now()
      })
    }
  }
  for (const [type, update] of [
    [
      "layout-shift",
      (entry) => {
        if (!entry.hadRecentInput) window.__measurement.cls += entry.value
      }
    ],
    [
      "largest-contentful-paint",
      (entry) => {
        window.__measurement.lcp = entry.startTime
      }
    ],
    [
      "event",
      (entry) => {
        if (entry.interactionId)
          window.__measurement.interactions.push(entry.duration)
      }
    ]
  ]) {
    if (PerformanceObserver.supportedEntryTypes.includes(type))
      new PerformanceObserver((list) =>
        list.getEntries().forEach(update)
      ).observe({
        type,
        buffered: true,
        ...(type === "event" ? { durationThreshold: 16 } : {})
      })
  }
  // Legacy rendering lives in the main thread; the loading worker has its own global.
  let sequence = 0,
    lastDrawSequence = -1
  function next() {
    sequence++
    requestAnimationFrame(next)
  }
  requestAnimationFrame(next)
  for (const method of [
    "drawElements",
    "drawArrays",
    "drawElementsInstanced",
    "drawArraysInstanced"
  ]) {
    const original = WebGL2RenderingContext.prototype[method]
    WebGL2RenderingContext.prototype[method] = function (...args) {
      if (window.__measurement.capture && lastDrawSequence !== sequence) {
        lastDrawSequence = sequence
        window.__measurement.drawTimes.push(performance.now())
      }
      return original.apply(this, args)
    }
  }
}

/** Diagnostic-only control: match the original renderer's offscreen MSAA. */
export function matchSceneSamples(samples) {
  let graphics
  const wrapped = new WeakSet()
  window.__measurement.sampleOverrides = []
  Object.defineProperty(window, "__graphics", {
    configurable: true,
    get: () => graphics,
    set: (value) => {
      graphics = value
      const renderer = value?.renderer
      if (!renderer || wrapped.has(renderer)) return
      wrapped.add(renderer)
      const original = renderer.setRenderTarget.bind(renderer)
      renderer.setRenderTarget = (target, ...args) => {
        // The diagnostic renderer is exposed before compile/render effects.
        // Set the sample count before Three allocates or compiles this target.
        if (target?.samples > 0 && target.samples !== samples) {
          window.__measurement.sampleOverrides.push({
            requested: target.samples,
            effective: samples,
            width: target.width,
            height: target.height
          })
          target.samples = samples
        }
        return original(target, ...args)
      }
    }
  })
}
