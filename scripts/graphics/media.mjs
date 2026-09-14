/** Exercise the real media components with delayed media, without CMS or form writes. */
import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { chromium } from "playwright"

// tsx already owns esbuild; use its installed version for this isolated browser fixture.
const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve("tsx/package.json"))("esbuild")
const baseURL = process.argv[2] ?? "http://localhost:3202"
const directory = process.env.RESULTS_DIR ?? ".context/performance/media"
await mkdir(directory, { recursive: true })
const bundle = await build({
  stdin: {
    contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {ImageWithVideoOverlay} from './src/components/primitives/image-with-video-overlay';
      import {LazyVideo} from './src/components/primitives/lazy-video';
      const image = {url:'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',alt:'',width:480,height:270,blurDataURL:''};
      function App() {
        const [disabled,setDisabled] = React.useState(false);
        window.setDisabled = setDisabled;
        return <>
          <div id="preview" style={{width:480,height:270,position:'relative'}}>
            <ImageWithVideoOverlay image={image} disabled={disabled} video={{type:'legacy',url:'/__slow.mp4',mimeType:'video/mp4'}} />
          </div>
          <div style={{height:1800}} />
          <div id="gallery" style={{height:270,width:480}}>
            <LazyVideo src="/__gallery.mp4" muted loop style={{height:270,width:480}} />
          </div>
          <div id="mux" style={{height:270,width:480,position:'relative'}}>
            <ImageWithVideoOverlay image={image} video={{type:'mux',playbackId:'lt3REdzzyH00LGKzLu8JU45KWrbrA02ynaUGwqBweMXdc'}} />
          </div>
        </>;
      }
      createRoot(document.getElementById('root')).render(<App/>);
    `,
    resolveDir: process.cwd(),
    loader: "tsx"
  },
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "silent"
})
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {})
})
const checks = []
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } })
  const errors = []
  page.on("pageerror", (error) => {
    errors.push(error.message)
    console.error(error.message)
  })
  let release,
    requested = false,
    galleryRequests = 0
  const held = new Promise((resolve) => {
    release = resolve
  })
  let releaseMux
  const heldMux = new Promise((resolve) => {
    releaseMux = resolve
  })
  await page.route("https://stream.mux.com/**", async (route) => {
    await heldMux
    await route.continue()
  })
  const bytes = await readFile(
    "public/3d/video/video-SM_TvScreen_1-7ab9d38c.mp4"
  )
  await page.route("**/__performance-media", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<style>.relative{position:relative}.absolute{position:absolute}.inset-0{inset:0}.h-full{height:100%}.w-full{width:100%}video,mux-video{width:100%;height:100%}</style><div id="root"></div><script>window.process={env:{NODE_ENV:"production"}}</script><script src="/__fixture.js"></script>`
    })
  )
  await page.route("**/__fixture.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: bundle.outputFiles[0].text
    })
  )
  await page.route("**/__slow.mp4", async (route) => {
    requested = true
    await held
    await route.fulfill({ contentType: "video/mp4", body: bytes })
  })
  await page.route("**/__gallery.mp4", (route) => {
    galleryRequests++
    return route.fulfill({ contentType: "video/mp4", body: bytes })
  })
  await page.goto(new URL("/__performance-media", baseURL).href)
  await page.locator("#preview").hover()
  await page.locator("#preview video").waitFor()
  await page.waitForTimeout(200)
  assert.ok(requested)
  assert.equal(galleryRequests, 0)
  await page.mouse.move(800, 500)
  release()
  await page.waitForFunction(
    () => document.querySelector("#preview video")?.readyState >= 2
  )
  assert.equal(
    await page.locator("#preview video").evaluate((v) => v.paused),
    true
  )
  checks.push("leave before media readiness stays paused")
  await page.locator("#preview").hover()
  await page.waitForFunction(
    () => !document.querySelector("#preview video").paused
  )
  await page.evaluate(() => {
    window.setDisabled(true)
  })
  await page.waitForFunction(
    () => document.querySelector("#preview video").paused
  )
  checks.push("disabling active preview pauses it")
  await page.evaluate(() => {
    window.setDisabled(false)
  })
  await page.mouse.move(800, 500)
  await page.locator("#preview").hover()
  await page.waitForFunction(
    () => !document.querySelector("#preview video").paused
  )
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true
    })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  assert.equal(
    await page.locator("#preview video").evaluate((v) => v.paused),
    true
  )
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false
    })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  await page.waitForFunction(
    () => !document.querySelector("#preview video").paused
  )
  checks.push("hidden-tab pause and visible-tab reconciliation")
  await page.locator("#gallery").scrollIntoViewIfNeeded()
  await page.waitForFunction(
    () => document.querySelector("#gallery video")?.paused === false
  )
  assert.ok(galleryRequests > 0)
  assert.equal(
    await page.locator("#preview video").evaluate((v) => v.paused),
    true
  )
  await page.evaluate(() => scrollTo(0, 0))
  await page.waitForFunction(
    () => document.querySelector("#gallery video").paused
  )
  await page.locator("#gallery").scrollIntoViewIfNeeded()
  await page.waitForFunction(
    () => !document.querySelector("#gallery video").paused
  )
  checks.push("native gallery defers loading and pauses offscreen")
  // The same hover controller must reach the asynchronously mounted Mux element.
  await page.locator("#mux").scrollIntoViewIfNeeded()
  const muxRequested = page.waitForRequest((request) =>
    request.url().startsWith("https://stream.mux.com/")
  )
  await page.locator("#mux").hover()
  await page.locator("#mux video").waitFor()
  await muxRequested
  await page.mouse.move(800, 500)
  releaseMux()
  await page.waitForTimeout(1500)
  assert.equal(await page.locator("#mux video").evaluate((v) => v.paused), true)
  await page.locator("#mux").hover()
  await page.waitForFunction(
    () => document.querySelector("#mux video")?.paused === false,
    null,
    { timeout: 30000 }
  )
  await page.mouse.move(800, 500)
  await page.waitForFunction(() => document.querySelector("#mux video").paused)
  checks.push("Mux preview respects current hover after dynamic mount")
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(
    new URL("/showcase/apollo-a-brand-built-for-liftoff", baseURL).href,
    { waitUntil: "domcontentloaded" }
  )
  const rows = page.getByRole("checkbox", { name: "Rows", exact: true })
  const grid = page.getByRole("checkbox", { name: "Grid", exact: true })
  await rows.click()
  assert.equal(await rows.getAttribute("aria-checked"), "true")
  await page.screenshot({ path: `${directory}/gallery-rows.png` })
  await grid.click()
  assert.equal(await grid.getAttribute("aria-checked"), "true")
  await page.screenshot({ path: `${directory}/gallery-grid.png` })
  checks.push("production gallery switches between rows and grid")
  assert.deepEqual(errors, [])
  console.log(checks)
  await writeFile(
    `${directory}/results.json`,
    JSON.stringify({ checks, errors }, null, 2)
  )
} finally {
  await browser.close()
}
