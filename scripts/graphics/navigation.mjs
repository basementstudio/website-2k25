/** Capture cold/warm page transitions at a fixed desktop resolution. */
import { chromium } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"
import { freezeEnvironment, instrumentBrowser } from "./environment.mjs"
const baseURL = process.argv[2] ?? "http://localhost:3103"
const label = process.argv[3] ?? "navigation"
const directory = `.context/${label}`
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {})
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: Number(process.env.DEVICE_DPR ?? 2)
})
await context.addInitScript(freezeEnvironment)
await context.addInitScript(instrumentBrowser)
const page = await context.newPage()
const errors = [],
  results = []
page.on("pageerror", (error) => errors.push(error.message))
await page.goto(baseURL)
await page.waitForFunction(
  () =>
    window.__measurement.legacyReady ||
    performance.getEntriesByName("graphics:first-frame").length,
  null,
  { timeout: 60000 }
)
await page.waitForTimeout(12000)
const cdp = await context.newCDPSession(page)
await cdp.send("Profiler.enable")
await cdp.send("Profiler.start")
for (let lap = 0; lap < 2; lap++)
  for (const route of ["/services", "/people", "/blog", "/lab", "/"]) {
    await page.evaluate(() => {
      const g = window.__graphics
      if (g) g.drawTimes = []
      window.__measurement.drawTimes = []
      window.__measurement.capture = true
      window.__measurement.interactions = []
      let camera
      g?.scene.traverse((o) => {
        if (!camera && o.__r3f) camera = o.__r3f.root.getState().camera
      })
      const initial = camera?.position.clone(),
        samples = []
      window.__navigationCapture = {
        started: performance.now(),
        samples,
        initial: initial?.toArray() ?? null
      }
      document.addEventListener(
        "click",
        () => {
          window.__navigationCapture.clickedAt = performance.now()
        },
        { capture: true, once: true }
      )
      function sample() {
        samples.push({
          time: performance.now(),
          position: camera?.position.toArray() ?? null
        })
        if (samples.length < 1500 && window.__navigationCapture.running)
          requestAnimationFrame(sample)
      }
      window.__navigationCapture.running = true
      requestAnimationFrame(sample)
    })
    await page.locator(`a[href="${route}"]`).first().click()
    await page.waitForTimeout(4500)
    const measured = await page.evaluate(() => {
      const cap = window.__navigationCapture
      cap.running = false
      const g = window.__graphics
      const times = g?.drawTimes ?? window.__measurement.drawTimes
      if (g) g.drawTimes = null
      window.__measurement.capture = false
      return {
        ...cap,
        interactionDurations: [...window.__measurement.interactions],
        backend: g?.renderer.domElement.dataset.backend ?? "legacy-webgl",
        drawingBuffers: [...document.querySelectorAll("canvas")].map((c) => [
          c.width,
          c.height
        ]),
        frames: times.slice(1).map((t, i) => t - times[i])
      }
    })
    const values = [...measured.frames].sort((a, b) => a - b)
    results.push({
      route,
      lap,
      ...measured,
      p50: values[Math.floor(values.length * 0.5)],
      p95: values[Math.floor(values.length * 0.95)],
      max: values.at(-1)
    })
    console.log(
      JSON.stringify({
        route,
        lap,
        p95: results.at(-1).p95,
        max: results.at(-1).max
      })
    )
    await writeFile(
      `${directory}/results.json`,
      JSON.stringify(
        {
          baseURL,
          browser: browser.version(),
          viewport: {
            width: 1440,
            height: 900,
            deviceDpr: Number(process.env.DEVICE_DPR ?? 2)
          },
          results,
          errors
        },
        null,
        2
      )
    )
  }
const { profile } = await cdp.send("Profiler.stop")
await writeFile(`${directory}/cpu.cpuprofile`, JSON.stringify(profile))
await browser.close()
