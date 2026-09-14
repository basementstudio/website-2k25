/** Functional checks only. Browser emulation does not establish mobile GPU performance. */
import assert from "node:assert/strict"
import { chromium, firefox } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"
import { freezeEnvironment } from "./environment.mjs"
const baseURL = process.argv[2] ?? "http://localhost:3103"
const backend = process.env.BACKEND ?? "webgpu"
const directory = process.env.RESULTS_DIR ?? `.context/smoke-${backend}`
await mkdir(directory, { recursive: true })
const engine = process.env.BROWSER === "firefox" ? firefox : chromium
const browser = await engine.launch({
  headless: true,
  ...(engine === chromium && process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {})
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce"
})
await context.addInitScript(freezeEnvironment)
await context.addInitScript(() => {
  const Original = Worker
  window.__activeGraphicsWorkers = new Set()
  let id = 0
  window.Worker = class extends Original {
    constructor(...args) {
      super(...args)
      this.trackedId = ++id
      window.__activeGraphicsWorkers.add(this.trackedId)
    }
    terminate() {
      window.__activeGraphicsWorkers.delete(this.trackedId)
      return super.terminate()
    }
  }
})
const page = await context.newPage()
const errors = [],
  results = []
page.on("pageerror", (error) => {
  errors.push(error.message)
  console.log(error.stack)
})
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    /THREE\.TSL|Shader Error|GPUValidationError|Error while parsing WGSL/.test(
      message.text()
    )
  )
    errors.push(message.text())
})
const urlFor = (route) =>
  new URL(`${route}${backend === "webgl2" ? "?backend=webgl2" : ""}`, baseURL)
    .href
const ready = () =>
  page.waitForFunction(
    () => performance.getEntriesByName("graphics:first-frame").length,
    null,
    { timeout: 60000 }
  )
try {
  for (const route of process.env.INTERACTIONS_ONLY
    ? []
    : [
        "/",
        "/services",
        "/people",
        "/blog",
        "/lab",
        "/showcase",
        "/basketball",
        "/doom",
        "/missing-webgpu-reference"
      ]) {
    errors.length = 0
    await page.goto(urlFor(route), { waitUntil: "domcontentloaded" })
    await ready()
    await page.waitForTimeout(route === "/doom" ? 12000 : 5000)
    const canvasBackend = await page
      .locator("canvas[data-backend]")
      .first()
      .getAttribute("data-backend")
    assert.ok(["webgpu", "webgl2"].includes(canvasBackend))
    await page.screenshot({
      path: `${directory}/${route === "/" ? "home" : route.slice(1)}.png`
    })
    results.push({ route, backend: canvasBackend, errors: [...errors] })
    await writeFile(
      `${directory}/results.json`,
      JSON.stringify(results, null, 2)
    )
    console.log(route, canvasBackend, errors)
    assert.deepEqual(errors, [], `Runtime errors on ${route}`)
  }
  await page.goto(urlFor("/"))
  await ready()
  await page.waitForTimeout(6000)
  const original = await page.locator("canvas[data-backend]").elementHandle()
  for (const route of ["/services", "/people", "/blog", "/lab", "/"]) {
    await page.locator(`a[href="${route}"]`).first().click()
    await page.waitForTimeout(3500)
    assert.equal(
      await original.evaluate((node) => node.isConnected),
      true,
      "Main canvas must persist across navigation"
    )
    assert.equal(await page.locator("canvas").count(), 1)
  }
  const mainWorkers = await page.evaluate(() => [
    ...window.__activeGraphicsWorkers
  ])
  let contactWorkerCount = null
  for (let i = 0; i < 3; i++) {
    await page.getByText("Contact Us", { exact: true }).first().click()
    await page
      .locator('.contact-screen input[name="email"]')
      .waitFor({ state: "visible" })
    await page.waitForTimeout(4000)
    await page
      .locator('.contact-screen input[name="email"]')
      .fill("graphics-check@example.com")
    assert.equal(await page.locator("canvas").count(), 2)
    const activeWorkers = await page.evaluate(
      () => window.__activeGraphicsWorkers.size
    )
    if (contactWorkerCount === null) contactWorkerCount = activeWorkers
    else
      assert.equal(
        activeWorkers,
        contactWorkerCount,
        "Reopening contact must reuse its decoder workers"
      )
    await page
      .locator(".contact-screen button")
      .filter({ hasText: "close" })
      .click()
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("canvas")].filter(
          (canvas) => getComputedStyle(canvas).visibility === "visible"
        ).length === 1,
      null,
      { timeout: 10000 }
    )
  }
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.waitForTimeout(2000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForTimeout(2000)
  const canRecover = await page.evaluate(() => Boolean(window.__graphics))
  if (canRecover) {
    await page.evaluate(() => {
      const renderer = window.__graphics.renderer
      if (renderer.backend.device) renderer.backend.device.destroy()
      else
        renderer.onDeviceLost({
          api: "WebGL",
          message: "Smoke test context loss",
          reason: null
        })
    })
    await page.waitForFunction(
      () => document.querySelector('canvas[data-backend="webgl2"]'),
      null,
      { timeout: 60000 }
    )
    await page.waitForFunction(
      () => performance.getEntriesByName("graphics:first-frame").length >= 2,
      null,
      { timeout: 60000 }
    )
    await page.waitForTimeout(5000)
    const recoveredWorkers = await page.evaluate(() => [
      ...window.__activeGraphicsWorkers
    ])
    assert.ok(
      mainWorkers.every((id) => !recoveredWorkers.includes(id)),
      "Recovery must terminate the old renderer's decoder workers"
    )
    assert.equal(await page.locator("canvas").count(), 2)
    await page.getByText("Contact Us", { exact: true }).first().click()
    await page.waitForTimeout(4000)
    assert.equal(
      await page.locator('.contact-screen input[name="email"]').inputValue(),
      "graphics-check@example.com"
    )
    await page
      .locator(".contact-screen button")
      .filter({ hasText: "close" })
      .click()
    await page.waitForTimeout(2000)
    await page.evaluate(() =>
      window.__graphics.renderer.onDeviceLost({
        api: "WebGL",
        message: "Second test failure",
        reason: null
      })
    )
    await page.waitForFunction(
      () => document.documentElement.dataset.canvasUnavailable === "true"
    )
  }
  results.push({
    interactionTrace: "navigation/contact/resize/recovery",
    errors: [...errors]
  })
  assert.deepEqual(errors, [])
  await writeFile(`${directory}/results.json`, JSON.stringify(results, null, 2))
  console.log("Interaction trace passed")
} finally {
  await browser.close()
}
