/** Count actual renderer calls separately from the loader's visible fade. */
import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { chromium } from "playwright"

import { freezeEnvironment } from "./environment.mjs"

const baseURL = process.argv[2] ?? "http://localhost:3103"
const backend = process.env.BACKEND ?? "webgpu"
const directory = process.env.RESULTS_DIR ?? `.context/preparation-${backend}`
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {})
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: process.env.REDUCED_MOTION ?? "no-preference"
})
await context.addInitScript(freezeEnvironment)
await context.addInitScript(() => {
  let graphics
  const wrapped = new WeakSet()
  window.__preparationCalls = []
  Object.defineProperty(window, "__graphics", {
    configurable: true,
    get: () => graphics,
    set: (value) => {
      graphics = value
      const renderer = value?.renderer
      if (!renderer || wrapped.has(renderer)) return
      wrapped.add(renderer)
      for (const name of ["compileAsync", "initTexture"]) {
        const original = renderer[name].bind(renderer)
        renderer[name] = (...args) => {
          const call = {
            name,
            start: performance.now(),
            end: null,
            ...(name === "compileAsync"
              ? {
                  object: args[0].name,
                  target: renderer.getRenderTarget()?.uuid,
                  samples: renderer.getRenderTarget()?.samples
                }
              : {})
          }
          window.__preparationCalls.push(call)
          const result = original(...args)
          if (name === "compileAsync")
            return result.finally(() => {
              call.end = performance.now()
            })
          call.end = performance.now()
          return result
        }
      }
    }
  })
})
const page = await context.newPage()
if (process.env.THROTTLE === "1") {
  const cdp = await context.newCDPSession(page)
  await cdp.send("Network.enable")
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 80,
    downloadThroughput: 1_250_000,
    uploadThroughput: 1_250_000
  })
}
const errors = [],
  results = []
page.on("pageerror", (error) => errors.push(error.message))
const snapshot = async (phase) => {
  results.push({
    phase,
    ...(await page.evaluate(() => {
      const prepared = performance.getEntriesByName(
        "graphics:scene-prepared"
      )[0]?.startTime
      const presented = performance.getEntriesByName("graphics:first-frame")[0]
        ?.startTime
      let meshes = 0
      window.__graphics.scene.traverse((object) => {
        if (object.geometry) meshes++
      })
      return {
        calls: window.__preparationCalls,
        cache: window.__graphics.preparation,
        prepared,
        presented,
        fade: presented - prepared,
        meshes,
        backend: document.querySelector("canvas[data-backend]").dataset.backend
      }
    }))
  })
  await writeFile(
    `${directory}/results.json`,
    JSON.stringify({ baseURL, backend, results, errors }, null, 2)
  )
}
try {
  const entry = new URL(process.env.ENTRY_ROUTE ?? "/", baseURL)
  if (backend === "webgl2") entry.searchParams.set("backend", "webgl2")
  await page.goto(entry.href, { waitUntil: "domcontentloaded" })
  await page.waitForFunction(
    () => performance.getEntriesByName("graphics:first-frame").length,
    null,
    { timeout: 60000 }
  )
  await snapshot("handoff")
  await page.waitForTimeout(15000)
  await snapshot("idle")
  if (process.env.WARM === "1") {
    await page.goto(entry.href, { waitUntil: "domcontentloaded" })
    await page.waitForFunction(
      () => performance.getEntriesByName("graphics:first-frame").length,
      null,
      { timeout: 60000 }
    )
    await snapshot("warm-handoff")
  } else {
    await page.locator('a[href="/services"]').first().click()
    await page.waitForTimeout(5000)
    await snapshot("services")
  }
  assert.deepEqual(errors, [])
  assert.ok(results.every((result) => result.backend === backend))
  console.log(
    results.map(({ calls, ...result }) => ({
      ...result,
      compileCalls: calls.filter((call) => call.name === "compileAsync").length,
      textureCalls: calls.filter((call) => call.name === "initTexture").length,
      // Sum of async API durations, not GPU time or main-thread CPU time.
      asyncElapsed: calls
        .filter((call) => call.name === "compileAsync")
        .reduce((sum, call) => sum + call.end - call.start, 0)
    }))
  )
} finally {
  await browser.close()
}
