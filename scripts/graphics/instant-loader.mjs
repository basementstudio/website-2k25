import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { chromium } from "playwright"
const base = process.argv[2] ?? "http://localhost:3103"
const directory = ".context/instant-loader"
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {})
})
const results = []
try {
  for (const [name, viewport, route, reducedMotion] of [
    ["desktop", { width: 1440, height: 900 }, "/", "no-preference"],
    ["mobile", { width: 390, height: 844 }, "/", "reduce"],
    [
      "404",
      { width: 1440, height: 900 },
      "/instant-loader-missing",
      "no-preference"
    ]
  ]) {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport,
      reducedMotion
    })
    const page = await context.newPage()
    const response = await page.goto(base + route, {
      waitUntil: "domcontentloaded"
    })
    if (name === "404") {
      assert.equal(response.status(), 404)
      assert.match(
        await page
          .locator('meta[name="robots"]')
          .first()
          .getAttribute("content"),
        /noindex/
      )
    }
    // Without JS, streamed Suspense content remains in Next's hidden staging
    // container. Assert the visible initial fallback, not that inert copy.
    const visibleLoader = page.locator("[data-instant-loader]:visible")
    await visibleLoader.locator("svg").waitFor({ state: "visible" })
    assert.equal(await visibleLoader.count(), 1)
    assert.equal(await page.locator("canvas").count(), 0)
    assert.ok(
      !(await page.locator("body").innerText()).includes("Opening the basement")
    )
    const state = await visibleLoader.evaluate((el) => ({
      opacity: getComputedStyle(el).opacity,
      paths: el.querySelector("path").getAttribute("d").length,
      animation: getComputedStyle(el.querySelector("path:last-child"))
        .animationName
    }))
    assert.equal(state.opacity, "1")
    assert.ok(state.paths > 1000)
    if (reducedMotion === "reduce") assert.equal(state.animation, "none")
    else assert.notEqual(state.animation, "none")
    await page.screenshot({ path: `${directory}/${name}-no-js.png` })
    results.push({ name, visibleWithoutJavaScript: true, ...state })
    await context.close()
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  })
  await context.addInitScript(() => {
    if (!navigator.gpu) return
    const request = navigator.gpu.requestAdapter.bind(navigator.gpu)
    navigator.gpu.requestAdapter = async (...args) => {
      await new Promise((resolve) => {
        window.__releaseGPU = resolve
      })
      return request(...args)
    }
  })
  const page = await context.newPage(),
    errors = [],
    requests = []
  page.on("pageerror", (e) => {
    errors.push(e.message)
    console.error(e.stack)
  })
  page.on("response", (response) => {
    if (
      response.request().resourceType() === "script" &&
      (response.status() >= 400 ||
        response.headers()["content-type"]?.includes("text/html"))
    )
      console.error(
        "Invalid script response",
        response.status(),
        response.url()
      )
  })
  page.on("request", (r) => requests.push(r.url()))
  await page.goto(base, { waitUntil: "domcontentloaded" })
  await page.waitForFunction(() => window.__releaseGPU, null, {
    timeout: 15000
  })
  await page.waitForTimeout(1000)
  assert.equal(
    await page
      .locator("[data-instant-loader]")
      .evaluate((el) => getComputedStyle(el).opacity),
    "1"
  )
  assert.ok(
    !requests.some((url) => /\/3d\/models\/office-/.test(url)),
    "Main model must wait for the first loader frame"
  )
  await page.screenshot({
    path: `${directory}/delayed-gpu.png`
  })
  await page.evaluate(() => window.__releaseGPU())
  await page.waitForFunction(
    () => performance.getEntriesByName("graphics:first-frame").length,
    null,
    { timeout: 60000 }
  )
  const timing = await page.evaluate(() => ({
    loader: performance.getEntriesByName("graphics:loader-frame")[0].startTime,
    scene: performance.getEntriesByName("graphics:first-frame")[0].startTime,
    firstModel: performance
      .getEntriesByType("resource")
      .find((r) => /\/3d\/models\/office-/.test(r.name))?.startTime
  }))
  assert.ok(timing.firstModel >= timing.loader)
  assert.ok(
    !requests.some((url) => /officeWireframe|\/3d\/posters\//.test(url))
  )
  assert.equal(await page.locator("[data-instant-loader]").count(), 0)
  assert.equal(await page.locator("canvas").count(), 1)
  assert.deepEqual(errors, [])
  results.push({ name: "delayed-gpu", ...timing, errors })
  await context.close()
  console.log(results)
} finally {
  await writeFile(`${directory}/results.json`, JSON.stringify(results, null, 2))
  await browser.close()
}
