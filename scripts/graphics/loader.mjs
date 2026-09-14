import assert from "node:assert/strict"
import { chromium } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"
import { freezeEnvironment } from "./environment.mjs"
const baseURL = process.argv[2] ?? "http://localhost:3103"
const directory = ".context/loader-check"
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {})
})
const results = []
for (const backend of ["webgpu", "webgl2"]) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  })
  await context.addInitScript(freezeEnvironment)
  const page = await context.newPage(),
    errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /THREE\.TSL|Shader Error|GPUValidationError|Error while parsing WGSL/.test(
        message.text()
      )
    )
      errors.push(message.text())
  })
  await page.route("**/3d/models/office-*.glb", async (route) => {
    await new Promise((r) => setTimeout(r, 8000))
    await route.continue().catch(() => {})
  })
  await page.goto(baseURL + (backend === "webgl2" ? "/?backend=webgl2" : ""), {
    waitUntil: "domcontentloaded"
  })
  await page.waitForFunction(
    () => document.querySelector('[data-live-loader="true"]'),
    null,
    { timeout: 15000 }
  )
  assert.equal(await page.locator("canvas").count(), 1)
  assert.equal(
    await page.evaluate(
      () => performance.getEntriesByName("graphics:first-frame").length
    ),
    0
  )
  await page.mouse.move(700, 450)
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${directory}/${backend}.png` })
  await page.waitForFunction(
    () => performance.getEntriesByName("graphics:first-frame").length,
    null,
    { timeout: 60000 }
  )
  assert.equal(await page.locator("[data-scene-loader]").count(), 0)
  assert.deepEqual(errors, [])
  results.push({ backend, loaderAndSceneShareCanvas: true, errors })
  await context.close()
}
await writeFile(`${directory}/results.json`, JSON.stringify(results, null, 2))
console.log(results)
await browser.close()
