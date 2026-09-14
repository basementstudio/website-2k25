/** The router's error tree must not retain a second site canvas after exit. */
import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { chromium } from "playwright"
const base = process.argv[2] ?? "http://localhost:3103"
const directory = ".context/instant-not-found"
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
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce"
    })
    const page = await context.newPage(),
      errors = []
    page.on("pageerror", (error) => errors.push(error.message))
    // Preserve the forced backend across the full-document return to Home.
    if (backend === "webgl2")
      await context.addInitScript(() => {
        if (navigator.gpu) navigator.gpu.requestAdapter = async () => null
      })
    const response = await page.goto(`${base}/missing-loader-return`)
    assert.equal(response.status(), 404)
    await page.waitForFunction(
      () => performance.getEntriesByName("graphics:first-frame").length,
      null,
      { timeout: 60000 }
    )
    assert.equal(
      await page.locator("canvas[data-backend]").getAttribute("data-backend"),
      backend
    )
    await page.getByRole("button", { name: "Go Back Home" }).click()
    await page.waitForURL(new URL("/", base).href)
    await page.waitForFunction(
      () =>
        performance.getEntriesByName("graphics:first-frame").length &&
        window.__graphics?.entry.scene === "home",
      null,
      { timeout: 60000 }
    )
    await page.evaluate(() => {
      window.__graphics.drawTimes = []
    })
    await page.waitForTimeout(500)
    const state = await page.evaluate(() => ({
      document: performance.getEntriesByType("navigation")[0].name,
      frames: window.__graphics.drawTimes.length
    }))
    assert.equal(state.document, new URL("/", base).href)
    assert.ok(state.frames >= 5)
    assert.equal(await page.locator("canvas").count(), 1)
    assert.equal(await page.locator("[data-scene-loader]").count(), 0)
    assert.deepEqual(errors, [])
    await page.screenshot({ path: `${directory}/${backend}-returned-home.png` })
    results.push({
      backend,
      status: 404,
      canvasesAfterReturn: 1,
      ...state,
      errors
    })
    await context.close()
  }
  console.log(results)
} finally {
  await writeFile(`${directory}/results.json`, JSON.stringify(results, null, 2))
  await browser.close()
}
