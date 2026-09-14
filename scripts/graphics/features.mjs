/** Fixed pointer/keyboard traces; no form or leaderboard submissions. */
import assert from "node:assert/strict"
import { chromium } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"
import { freezeEnvironment } from "./environment.mjs"
const baseURL = process.argv[2] ?? "http://localhost:3103"
const backend = process.env.BACKEND ?? "webgpu"
const directory = process.env.RESULTS_DIR ?? `.context/features-${backend}`
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {})
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce"
})
await context.addInitScript(freezeEnvironment)
await context.addInitScript(() => {
  window.__drawnText = []
  const fill = CanvasRenderingContext2D.prototype.fillText
  CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
    window.__drawnText.push(String(text))
    return fill.call(this, text, ...args)
  }
})
const page = await context.newPage()
const errors = [],
  checks = []
page.on("pageerror", (error) => errors.push(error.message))
page.on("console", (message) => {
  if (process.env.DEBUG && message.type() === "error")
    console.log("Browser:", message.text())
  if (
    message.type() === "error" &&
    /THREE\.TSL|Shader Error|GPUValidationError|Error while parsing WGSL/.test(
      message.text()
    )
  )
    errors.push(message.text())
})
const go = async (route) => {
  await page.goto(
    new URL(route + (backend === "webgl2" ? "?backend=webgl2" : ""), baseURL)
      .href,
    { waitUntil: "domcontentloaded" }
  )
  await page.waitForFunction(
    () => performance.getEntriesByName("graphics:first-frame").length,
    null,
    { timeout: 60000 }
  )
  await page.waitForTimeout(7000)
}
const capture = (name) => page.screenshot({ path: `${directory}/${name}.png` })
try {
  await go("/services")
  const statue = await page.evaluate(() => {
    let statue
    window.__graphics.scene.traverse((object) => {
      if (
        object.visible &&
        object.material?.defines?.IS_LOBO_MARINO &&
        object.__r3f?.handlers?.onClick
      )
        statue = object
    })
    if (!statue) return null
    window.__statue = statue
    statue.geometry.computeBoundingSphere()
    const point = statue
      .localToWorld(statue.geometry.boundingSphere.center.clone())
      .project(statue.__r3f.root.getState().camera)
    return {
      x: ((point.x + 1) * innerWidth) / 2,
      y: ((1 - point.y) * innerHeight) / 2,
      color: statue.material.uniforms.uColor.value.toArray()
    }
  })
  assert.equal(
    await page.evaluate(
      () => window.__statue?.material.uniforms.uColor.value.isColor
    ),
    true,
    "Weather color must use the node color binding type"
  )
  assert.ok(
    statue,
    "Services must retain its interactive weather statue regardless of asset loading order"
  )
  await page.mouse.click(statue.x, statue.y)
  await page.waitForTimeout(2500)
  const rainColor = await page.evaluate(() =>
    window.__statue.material.uniforms.uColor.value.toArray()
  )
  assert.notDeepEqual(
    rainColor,
    statue.color,
    "Clicking the statue must change weather"
  )
  await capture("rain")
  checks.push("Services weather statue and rain toggle")

  // Select the visible inspectable through its actual pointer hit area.
  const candidates = await page.evaluate(() => {
    const points = []
    window.__graphics.scene.traverse((object) => {
      if (
        !object.geometry ||
        !object.parent?.parent?.parent?.__r3f?.handlers?.onClick ||
        object.material?.colorWrite !== false
      )
        return
      if (object.geometry.type !== "BoxGeometry") return
      const point = object
        .getWorldPosition(object.position.clone())
        .project(object.__r3f.root.getState().camera)
      if (Math.abs(point.x) < 0.95 && Math.abs(point.y) < 0.9 && point.z < 1)
        points.push({
          x: ((point.x + 1) * innerWidth) / 2,
          y: ((1 - point.y) * innerHeight) / 2
        })
    })
    return points
  })
  let inspected = false
  for (const point of candidates) {
    await page.mouse.click(point.x, point.y)
    await page.waitForTimeout(1200)
    const close = page.getByRole("button", { name: "Close [ESC]", exact: true })
    if (await close.isVisible()) {
      await capture("inspectable")
      await page.mouse.move(550, 430)
      await page.mouse.down()
      await page.mouse.move(650, 440, { steps: 10 })
      await page.mouse.up()
      await close.click()
      inspected = true
      break
    }
  }
  assert.ok(inspected, "A services inspectable must open through its hit area")
  checks.push("Inspectable reveal, dragging and close")

  await go("/lab")
  await page.waitForFunction(() =>
    window.__graphics?.entry?.ready.includes("arcade")
  )
  await page.mouse.click(420, 148)
  await page.waitForURL((url) => url.pathname === "/")
  checks.push("Arcade texture UV close button")
  await go("/lab")
  for (const key of [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a"
  ]) {
    await page.keyboard.press(key)
    await page.waitForTimeout(100)
  }
  await page.waitForTimeout(4000)
  await capture("game-intro")
  await page.keyboard.press("Space")
  await page.waitForFunction(
    () => window.__drawnText.some((text) => text.startsWith("SCORE:")),
    null,
    { timeout: 10000 }
  )
  await page.keyboard.press("ArrowRight")
  await page.waitForTimeout(1800)
  await capture("gameplay")
  await page.keyboard.press("Escape")
  checks.push("Arcade keyboard unlock, game start, steering and HUD")

  await go("/basketball")
  const ball = await page.evaluate(() => {
    let ball
    window.__graphics.scene.traverse((object) => {
      if (
        object.material?.defines?.BASKETBALL &&
        object.__r3f?.handlers?.onPointerDown
      )
        ball = object
    })
    if (!ball) return null
    window.__ball = ball
    const point = ball
      .getWorldPosition(ball.position.clone())
      .project(ball.__r3f.root.getState().camera)
    return {
      x: ((point.x + 1) * innerWidth) / 2,
      y: ((1 - point.y) * innerHeight) / 2,
      position: ball.parent.position.toArray()
    }
  })
  if (!ball) {
    await capture("basketball-missing")
    console.log(
      await page.evaluate(() => {
        const balls = []
        window.__graphics.scene.traverse((object) => {
          if (object.material?.defines?.BASKETBALL)
            balls.push({
              visible: object.visible,
              handlers: Object.keys(object.__r3f?.handlers ?? {})
            })
        })
        return { entry: window.__graphics.entry, balls }
      })
    )
  }
  assert.ok(ball, "Basketball must expose the draggable ball")
  await page.mouse.move(ball.x, ball.y)
  await page.mouse.down()
  await page.mouse.move(ball.x + 40, ball.y - 150, { steps: 15 })
  await page.waitForTimeout(250)
  const moved = await page.evaluate(() =>
    window.__ball.parent.position.toArray()
  )
  await page.mouse.up()
  assert.notDeepEqual(moved, ball.position, "Ball must move during drag")
  await page.waitForTimeout(1000)
  await capture("basketball")
  checks.push("Basketball pointer drag and physics release")

  await go("/people")
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true
    })
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden"
    })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  await page.waitForTimeout(1500)
  await page.evaluate(() => {
    window.__graphics.drawTimes = []
  })
  await page.waitForTimeout(1000)
  assert.equal(
    await page.evaluate(() => window.__graphics.drawTimes.length),
    0,
    "Hidden scene must stop rendering"
  )
  await page.evaluate(() => {
    delete document.hidden
    delete document.visibilityState
    document.dispatchEvent(new Event("visibilitychange"))
  })
  await page.waitForTimeout(1500)
  assert.ok(await page.evaluate(() => window.__graphics.drawTimes.length > 0))
  checks.push("Hidden scene pause and resume")
  assert.deepEqual(errors, [])
} finally {
  await writeFile(
    `${directory}/results.json`,
    JSON.stringify({ backend, checks, errors }, null, 2)
  )
  console.log({ backend, checks, errors })
  await browser.close()
}
