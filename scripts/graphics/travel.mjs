/** Visual camera-travel record. Video capture timings are not performance metrics. */
import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { chromium } from "playwright"

import { freezeEnvironment } from "./environment.mjs"

const baseURL = process.argv[2] ?? "http://localhost:3103"
const backend = process.env.BACKEND ?? "webgpu"
const directory = process.env.RESULTS_DIR ?? `.context/travel-${backend}`
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
  reducedMotion: "no-preference",
  recordVideo: { dir: directory, size: { width: 1440, height: 900 } }
})
await context.addInitScript(freezeEnvironment)
const page = await context.newPage(),
  errors = []
page.on("pageerror", (error) => errors.push(error.message))
try {
  await page.goto(baseURL + (backend === "webgl2" ? "/?backend=webgl2" : "/"), {
    waitUntil: "domcontentloaded"
  })
  await page.waitForFunction(
    () => performance.getEntriesByName("graphics:first-frame").length,
    null,
    { timeout: 60000 }
  )
  await page.waitForTimeout(7000)
  for (const route of ["/services", "/people", "/"]) {
    await page.locator(`a[href="${route}"]`).first().click()
    await page.waitForTimeout(4500)
    await page.screenshot({
      path: `${directory}/${route.slice(1) || "home"}.png`
    })
  }
  assert.deepEqual(errors, [])
  await context.close()
  await page.video().saveAs(`${directory}/travel.webm`)
  await writeFile(
    `${directory}/results.json`,
    JSON.stringify({ baseURL, backend, errors, video: "travel.webm" }, null, 2)
  )
} finally {
  await browser.close()
}
