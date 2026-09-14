import assert from "node:assert/strict"
import { chromium } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"
import { freezeEnvironment } from "./environment.mjs"
const baseURL = process.argv[2] ?? "http://localhost:3103"
const directory = ".context/graphics-faults"
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {})
})
const results = []
for (const mode of [
  "initializing-navigation",
  "adapter-rejection",
  "both-backends-fail",
  "recovery-during-assets",
  "asset-failure"
]) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  })
  await context.addInitScript(freezeEnvironment)
  await context.addInitScript((mode) => {
    if (mode === "initializing-navigation" && navigator.gpu) {
      const original = navigator.gpu.requestAdapter.bind(navigator.gpu)
      navigator.gpu.requestAdapter = async (...args) => {
        await new Promise((r) => setTimeout(r, 5000))
        return original(...args)
      }
    }
    if (
      (mode === "adapter-rejection" || mode === "both-backends-fail") &&
      navigator.gpu
    )
      navigator.gpu.requestAdapter = () =>
        Promise.reject(new Error("Injected adapter failure"))
    if (mode === "both-backends-fail") {
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (type === "webgl2" || type === "webgpu") return null
        return original.call(this, type, ...args)
      }
    }
  }, mode)
  const page = await context.newPage()
  if (mode === "asset-failure")
    await page.route("**/3d/**/*.glb", (route) => route.abort())
  if (mode === "recovery-during-assets") {
    let delayed = false
    await page.route("**/3d/models/office-*.glb", async (route) => {
      if (!delayed) {
        delayed = true
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
      await route.continue().catch(() => {})
    })
  }
  try {
    await page.goto(baseURL, { waitUntil: "domcontentloaded" })
    if (mode === "recovery-during-assets") {
      await page.waitForFunction(() => window.__graphics?.renderer)
      await page.waitForTimeout(100)
      await page.evaluate(() => {
        const renderer = window.__graphics.renderer
        if (renderer.backend.device) renderer.backend.device.destroy()
        else renderer.onDeviceLost({ message: "Injected early context loss" })
      })
    }
    if (mode === "initializing-navigation") {
      await page.locator('a[href="/services"]').first().click()
      await page.waitForURL("**/services", { timeout: 3000 })
      assert.equal(
        await page.evaluate(
          () => performance.getEntriesByName("graphics:first-frame").length
        ),
        0
      )
    }
    if (mode === "both-backends-fail" || mode === "asset-failure") {
      await page.waitForFunction(
        () => document.documentElement.dataset.canvasUnavailable === "true",
        null,
        { timeout: 60000 }
      )
      await page.getByText("Contact Us", { exact: true }).first().click()
      await page.waitForURL("**/contact")
      await page.locator('input[name="email"]').waitFor({ state: "visible" })
      assert.equal(await page.locator("canvas").count(), 0)
    } else {
      await page.waitForFunction(
        () => performance.getEntriesByName("graphics:first-frame").length,
        null,
        { timeout: 60000 }
      )
      if (mode === "initializing-navigation")
        assert.equal(
          await page.evaluate(() => window.__graphics.entry.scene),
          "services"
        )
      if (mode === "adapter-rejection" || mode === "recovery-during-assets")
        assert.equal(
          await page
            .locator("canvas[data-backend]")
            .getAttribute("data-backend"),
          "webgl2"
        )
    }
    results.push({ mode, passed: true })
  } catch (error) {
    results.push({ mode, passed: false, error: error.message })
  }
  await page.screenshot({ path: `${directory}/${mode}.png` })
  await context.close()
  console.log(results.at(-1))
  await writeFile(`${directory}/results.json`, JSON.stringify(results, null, 2))
}
await browser.close()
assert.ok(
  results.every((result) => result.passed),
  "Fault scenarios failed"
)
