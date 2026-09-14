import assert from "node:assert/strict"
import { chromium } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"
const baseURL = process.argv[2] ?? "http://localhost:3103"
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {})
})
const results = []
await mkdir(".context/cctv-check", { recursive: true })
try {
  for (const backend of ["webgpu", "webgl2"]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce"
    })
    const page = await context.newPage(),
      errors = []
    page.on("pageerror", (e) => errors.push(e.message))
    await page.goto(
      `${baseURL}/${backend === "webgl2" ? "?backend=webgl2" : ""}`
    )
    await page.waitForFunction(() => window.__graphics?.cctvFrames > 0, null, {
      timeout: 60000
    })
    await page.waitForTimeout(3000)
    await page.screenshot({ path: `.context/cctv-check/home-${backend}.png` })
    await page.locator('a[href="/services"]').first().click()
    await page.waitForTimeout(3500)
    const frames = await page.evaluate(() => window.__graphics.cctvFrames)
    await page.waitForTimeout(4000)
    assert.equal(
      await page.evaluate(() => window.__graphics.cctvFrames),
      frames,
      "Offscreen CCTV must pause"
    )
    await page.goto(
      `${baseURL}/missing-cctv-check${backend === "webgl2" ? "?backend=webgl2" : ""}`
    )
    await page.waitForFunction(
      () =>
        performance.getEntriesByName("graphics:first-frame").length &&
        window.__graphics?.cctvFrames > 0,
      null,
      { timeout: 60000 }
    )
    assert.deepEqual(errors, [])
    results.push({
      backend,
      homeFeed: true,
      offscreenPaused: true,
      direct404: true,
      errors
    })
    await context.close()
  }
} finally {
  await browser.close()
}
await writeFile(
  ".context/cctv-check/results.json",
  JSON.stringify(results, null, 2)
)
console.log(results)
