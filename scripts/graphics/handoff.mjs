/** Holds a visible asset past base readiness to catch premature scene reveals. */
import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { chromium } from "playwright"
import { freezeEnvironment } from "./environment.mjs"

const baseURL = process.argv[2] ?? "http://localhost:3103"
const directory = process.env.RESULTS_DIR ?? ".context/handoff"
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {})
})
const results = []
try {
  for (const backend of ["webgpu", "webgl2"]) {
    for (const reducedMotion of ["no-preference", "reduce"]) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        reducedMotion
      })
      await context.addInitScript(freezeEnvironment)
      const page = await context.newPage()
      const errors = [],
        posters = []
      page.on("pageerror", (error) => errors.push(error.message))
      page.on("request", (request) => {
        if (request.url().includes("/3d/posters/")) posters.push(request.url())
      })
      let release
      const held = new Promise((resolve) => {
        release = resolve
      })
      let releaseVideo
      const heldVideo = new Promise((resolve) => {
        releaseVideo = resolve
      })
      await page.route(
        "**/3d/video/video-SM_TvScreen_1-*.mp4",
        async (route) => {
          await heldVideo
          await route.continue().catch(() => {})
        }
      )
      await page.route("**/3d/models/character-model-*.glb", async (route) => {
        await held
        await route.continue().catch(() => {})
      })
      const suffix = `${backend}-${reducedMotion}`
      await page.goto(
        baseURL + (backend === "webgl2" ? "/?backend=webgl2" : "/"),
        { waitUntil: "domcontentloaded" }
      )
      await page.waitForFunction(
        () => window.__graphics?.entry?.ready.includes("base"),
        null,
        { timeout: 60000 }
      )
      await page.waitForTimeout(800)
      assert.equal(
        await page.locator("canvas").count(),
        2,
        "The original loader has an isolated WebGL canvas"
      )
      assert.equal(
        await page.locator('[data-scene-loader="loading"]').count(),
        1
      )
      assert.equal(
        await page.evaluate(
          () => performance.getEntriesByName("graphics:scene-prepared").length
        ),
        0
      )
      await page.screenshot({ path: `${directory}/${suffix}-loading.png` })
      await page.evaluate(() => {
        window.__handoffFrames = []
        const sample = () => {
          const entry = window.__graphics?.entry
          const done =
            performance.getEntriesByName("graphics:first-frame").length > 0
          window.__handoffFrames.push({
            time: performance.now(),
            progress: entry?.reveal.value ?? 0,
            done
          })
          if (!done) requestAnimationFrame(sample)
        }
        requestAnimationFrame(sample)
      })
      release()
      await page.waitForFunction(
        () => window.__graphics?.entry?.ready.includes("characters"),
        null,
        { timeout: 60000 }
      )
      await page.waitForTimeout(500)
      assert.equal(
        await page.evaluate(
          () => performance.getEntriesByName("graphics:scene-prepared").length
        ),
        0,
        "visible video must also be decoded before revealing"
      )
      releaseVideo()
      {
        await page.waitForFunction(
          () => window.__graphics?.entry?.reveal.value > 0.2,
          null,
          { timeout: 60000 }
        )
        await page.screenshot({ path: `${directory}/${suffix}-fading.png` })
      }
      await page.waitForFunction(
        () => performance.getEntriesByName("graphics:first-frame").length,
        null,
        { timeout: 60000 }
      )
      await page.screenshot({ path: `${directory}/${suffix}-ready.png` })
      assert.equal(await page.locator("[data-scene-loader]").count(), 0)
      assert.equal(
        await page.locator("canvas").count(),
        1,
        "The loader canvas is released after handoff"
      )
      const state = await page.evaluate(() => ({
        entry: window.__graphics.entry,
        backend: document.querySelector("#canvas canvas")?.dataset.backend,
        frames: window.__handoffFrames,
        prepared: performance.getEntriesByName("graphics:scene-prepared")[0]
          .startTime,
        presented: performance.getEntriesByName("graphics:first-frame")[0]
          .startTime
      }))
      assert.equal(state.backend, backend)
      for (const key of ["characters", "pets", "details", "videos:home"])
        assert.ok(state.entry.ready.includes(key), key)
      const fadeFrames = state.frames.filter(
        (frame) => frame.progress > 0 && frame.progress < 1
      )
      {
        assert.ok(
          fadeFrames.length >= 8,
          "fade must span multiple presented frames"
        )
        assert.ok(
          state.presented - state.prepared >= 950,
          "the original one-second reveal must finish before removing the loader"
        )
      }
      assert.deepEqual(errors, [])
      assert.deepEqual(posters, [])
      results.push({
        backend,
        reducedMotion,
        assetHeldBeforeReveal: true,
        posters,
        errors,
        ...state
      })
      await context.close()
    }
  }
  console.log(results.map(({ frames, ...result }) => result))
} finally {
  await writeFile(`${directory}/results.json`, JSON.stringify(results, null, 2))
  await browser.close()
}
