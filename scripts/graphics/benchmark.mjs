/** Compare preserved production builds sequentially on the same real GPU. */
import { chromium } from "playwright"
import { execFile } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import { cpus, platform, release } from "node:os"
import { promisify } from "node:util"
import {
  freezeEnvironment,
  instrumentBrowser,
  matchSceneSamples
} from "./environment.mjs"

const [baseURL = "http://localhost:3103", label = "webgpu"] =
  process.argv.slice(2)
const trials = Number(process.env.TRIALS ?? 5)
const checkContention = process.env.QUIET === "1"
const exec = promisify(execFile)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const backgroundJobs = async () => {
  if (!checkContention) return false
  // Read executable names only; process arguments can contain credentials.
  const { stdout } = await exec("ps", ["-axo", "pid=,ppid=,comm="])
  const processes = stdout.split("\n").flatMap((line) => {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/)
    return match ? [{ pid: +match[1], parent: +match[2], name: match[3] }] : []
  })
  const parents = new Map(processes.map((p) => [p.pid, p.parent]))
  const ours = (pid) => {
    while (pid && pid !== process.pid) pid = parents.get(pid)
    return pid === process.pid
  }
  return processes.some(
    (p) =>
      !ours(p.pid) &&
      (p.name.startsWith("next-build") ||
        /\/(Google Chrome for Testing|chrome-headless-shell)$/.test(p.name) ||
        /ms-playwright\/.*\/firefox$/.test(p.name))
  )
}
const waitForQuiet = async () => {
  if (!checkContention) return
  let quietSince = 0,
    waiting = false
  while (!quietSince || Date.now() - quietSince < 5000) {
    if (await backgroundJobs()) {
      quietSince = 0
      if (!waiting)
        console.log("Waiting for other builds/graphics browsers to finish")
      waiting = true
    } else quietSince ||= Date.now()
    await sleep(1000)
  }
}
const directory = process.env.RESULTS_DIR ?? `.context/graphics-${label}`
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({
  headless: process.env.HEADED !== "1",
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {})
})
const report = {
  label,
  baseURL,
  machine: { platform: platform(), release: release(), cpu: cpus()[0]?.model },
  browser: browser.version(),
  executable: process.env.CHROME_PATH ?? "playwright default",
  collectedAt: new Date().toISOString(),
  contentionChecks: checkContention,
  discardedTrials: 0,
  sceneSamplesOverride: process.env.SCENE_SAMPLES === "0" ? 0 : null,
  viewport: { width: 1440, height: 900 },
  network: { latency: 80, bytesPerSecond: 1_250_000 },
  trials: []
}
const percentile = (values, p) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length * p)] ?? null
for (const route of process.env.ROUTES?.split(",") ?? [
  "/",
  "/services",
  "/people"
]) {
  for (let trial = 0; trial < trials; trial++) {
    await waitForQuiet()
    let contended = false
    const monitor = checkContention
      ? setInterval(() => {
          void backgroundJobs().then((busy) => {
            contended ||= busy
          })
        }, 1000)
      : null
    const firstResult = report.trials.length
    const context = await browser.newContext({
      viewport: report.viewport,
      deviceScaleFactor: 1,
      reducedMotion: "reduce"
    })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send("Network.enable")
    const transfers = new Map()
    cdp.on("Network.requestWillBeSent", (event) => {
      if (new URL(event.request.url).pathname.startsWith("/3d/"))
        transfers.set(event.requestId, { bytes: 0 })
    })
    cdp.on("Network.dataReceived", (event) => {
      const item = transfers.get(event.requestId)
      if (item) item.bytes += event.encodedDataLength
    })
    cdp.on("Network.loadingFinished", (event) => {
      const item = transfers.get(event.requestId)
      if (item) item.bytes = event.encodedDataLength
    })
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: report.network.latency,
      downloadThroughput: report.network.bytesPerSecond,
      uploadThroughput: report.network.bytesPerSecond
    })
    await page.addInitScript(freezeEnvironment)
    await page.addInitScript(instrumentBrowser)
    if (process.env.SCENE_SAMPLES === "0")
      await page.addInitScript(matchSceneSamples, 0)
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))
    const url = new URL(route, baseURL)
    if (label.includes("webgl2")) url.searchParams.set("backend", "webgl2")
    for (const cache of process.env.WARM === "0"
      ? ["cold"]
      : ["cold", "warm"]) {
      errors.length = 0
      transfers.clear()
      await page.goto(url.href, { waitUntil: "domcontentloaded" })
      let failed = false
      await page
        .waitForFunction(
          () =>
            window.__measurement.legacyReady ||
            performance.getEntriesByName("graphics:first-frame").length,
          null,
          { timeout: 90000 }
        )
        .catch(() => {
          failed = true
        })
      const startup = await page.evaluate(() => {
        const navigation = performance.getEntriesByType("navigation")[0]
        const firstFrame =
          window.__measurement.legacyReady ||
          performance.getEntriesByName("graphics:first-frame")[0]?.startTime ||
          null
        const assets = performance
          .getEntriesByType("resource")
          .filter(
            (entry) =>
              entry.name.includes("/3d/") && entry.responseEnd <= firstFrame
          )
          .map((entry) => ({
            url: new URL(entry.name).pathname,
            bytes: entry.encodedBodySize,
            decodedBytes: entry.decodedBodySize,
            transfer: entry.transferSize,
            start: entry.startTime,
            end: entry.responseEnd
          }))
        return {
          firstFrame,
          preparedAt:
            performance.getEntriesByName("graphics:scene-prepared")[0]
              ?.startTime ?? null,
          initialization:
            performance.getEntriesByName("graphics:initialize")[0]?.duration ??
            null,
          assets,
          scripts: performance
            .getEntriesByType("resource")
            .filter((entry) => entry.initiatorType === "script")
            .map((entry) => ({
              url: new URL(entry.name).pathname,
              start: entry.startTime,
              end: entry.responseEnd,
              bytes: entry.encodedBodySize
            })),
          initialBytes: assets.reduce((sum, entry) => sum + entry.bytes, 0),
          initialDecodedBytes: assets.reduce(
            (sum, entry) => sum + entry.decodedBytes,
            0
          ),
          transferredBytes: assets.reduce(
            (sum, entry) => sum + entry.transfer,
            0
          ),
          backend:
            document.querySelector("canvas[data-backend]")?.dataset.backend ??
            "legacy-webgl",
          cls: window.__measurement.cls,
          lcp: window.__measurement.lcp,
          ttfb: navigation.responseStart,
          domContentLoaded: navigation.domContentLoadedEventEnd
        }
      })
      startup.networkBytesAtFirstFrame = [...transfers.values()].reduce(
        (sum, item) => sum + item.bytes,
        0
      )
      const expectedBackend = label.startsWith("webgpu")
        ? "webgpu"
        : label.startsWith("webgl2")
          ? "webgl2"
          : null
      if (expectedBackend && startup.backend !== expectedBackend) failed = true
      if (
        process.env.SCENE_SAMPLES === "0" &&
        !(await page.evaluate(
          () => window.__measurement.sampleOverrides?.length
        ))
      )
        failed = true
      await page.waitForTimeout(10000)
      const pacing = await page.evaluate(
        () =>
          new Promise((resolve) => {
            const raf = []
            let last = 0,
              started = 0
            window.__measurement.capture = true
            if (window.__graphics) window.__graphics.drawTimes = []
            function sample(now) {
              if (!started) started = now
              if (last) raf.push(now - last)
              last = now
              if (now - started < 5000) requestAnimationFrame(sample)
              else {
                window.__measurement.capture = false
                const times =
                  window.__graphics?.drawTimes ?? window.__measurement.drawTimes
                const frames = times
                  .slice(1)
                  .map((value, index) => value - times[index])
                if (window.__graphics) window.__graphics.drawTimes = null
                resolve({ raf, frames })
              }
            }
            requestAnimationFrame(sample)
          })
      )
      if (!report.adapter)
        report.adapter = await page.evaluate(
          () =>
            window.__measurement.adapters[0] ?? {
              requestedByApplication: false
            }
        )
      if (trial === 0 && cache === "cold")
        await page.screenshot({
          path: `${directory}/${route === "/" ? "home" : route.slice(1)}.png`
        })
      report.trials.push({
        route,
        trial,
        cache,
        failed,
        ...startup,
        graphics: await page.evaluate(() => ({
          sampleOverrides: window.__measurement.sampleOverrides ?? [],
          adapters: window.__measurement.adapters,
          contexts: window.__measurement.contexts.map((gl) => {
            const ext = gl.getExtension("WEBGL_debug_renderer_info")
            return {
              vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null,
              renderer: ext
                ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
                : null,
              attributes: gl.getContextAttributes(),
              drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight]
            }
          }),
          canvases: [...document.querySelectorAll("canvas")].map((canvas) => ({
            width: canvas.width,
            height: canvas.height,
            cssWidth: canvas.clientWidth,
            cssHeight: canvas.clientHeight,
            backend: canvas.dataset.backend ?? null
          }))
        })),
        frameP50: percentile(pacing.frames, 0.5),
        frameP95: percentile(pacing.frames, 0.95),
        rafP95: percentile(pacing.raf, 0.95),
        frames: pacing.frames,
        errors: [...errors]
      })
      const result = report.trials.at(-1)
      if (
        result.graphics.contexts.some((context) =>
          /swiftshader|llvmpipe|software rasterizer/i.test(
            context.renderer ?? ""
          )
        ) ||
        result.graphics.adapters.some((adapter) => adapter.isFallbackAdapter)
      ) {
        result.failed = failed = true
      }
      await writeFile(
        `${directory}/results.json`,
        JSON.stringify(report, null, 2)
      )
      console.log(
        JSON.stringify({
          route,
          trial,
          cache,
          firstFrame: startup.firstFrame,
          bytes: startup.initialBytes,
          p95: report.trials.at(-1).frameP95,
          failed,
          errors
        })
      )
    }
    await context.close()
    if (monitor) clearInterval(monitor)
    if (contended) {
      report.trials.splice(firstResult)
      report.discardedTrials++
      await writeFile(
        `${directory}/results.json`,
        JSON.stringify(report, null, 2)
      )
      console.log(
        JSON.stringify({
          route,
          trial,
          discarded: "another build or graphics browser overlapped"
        })
      )
      trial--
    }
  }
}
await browser.close()
