/** Audio preparation must stay silent and resume from a real user gesture. */
import assert from "node:assert/strict"
import { chromium, firefox } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"
const engine = process.env.BROWSER === "firefox" ? firefox : chromium
const browser = await engine.launch({
  headless: true,
  ...(engine === chromium && process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {})
})
const results = []
try {
  for (const mode of ["idle", "early-click"]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    })
    await context.addInitScript(() => {
      const Original = AudioContext
      window.__audioContexts = []
      window.AudioContext = class extends Original {
        constructor(...args) {
          super(...args)
          window.__audioContexts.push(this)
        }
      }
    })
    const page = await context.newPage(),
      errors = []
    page.on("pageerror", (e) => errors.push(e.message))
    await page.goto(process.argv[2] ?? "http://localhost:3103")
    await page.waitForFunction(
      () => performance.getEntriesByName("graphics:first-frame").length,
      null,
      { timeout: 60000 }
    )
    if (mode === "idle") {
      await page.waitForFunction(() => window.__audioContexts.length === 1)
      assert.equal(
        await page.evaluate(() => window.__audioContexts[0].state),
        "suspended"
      )
    }
    await page.locator('a[href="/services"]').first().click()
    await page.waitForFunction(
      () =>
        window.__audioContexts.length === 1 &&
        window.__audioContexts[0].state === "running"
    )
    await page.waitForTimeout(3500)
    assert.equal(await page.evaluate(() => window.__audioContexts.length), 1)
    assert.deepEqual(errors, [])
    results.push({ mode, passed: true, contexts: 1 })
    await context.close()
  }
} finally {
  await browser.close()
}
await mkdir(".context/audio-check", { recursive: true })
await writeFile(
  `.context/audio-check/${process.env.BROWSER ?? "chromium"}.json`,
  JSON.stringify(results, null, 2)
)
console.log(results)
