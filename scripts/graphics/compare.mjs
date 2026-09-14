/** Compare every route/cache cell; never hide a regression in an overall average. */
import assert from "node:assert/strict"
import { readFile, writeFile } from "node:fs/promises"

const [beforePath, afterPath, outputPath] = process.argv.slice(2)
const [before, after] = await Promise.all(
  [beforePath, afterPath].map(async (path) =>
    JSON.parse(await readFile(path, "utf8"))
  )
)
assert.equal(before.label, after.label)
assert.equal(before.browser, after.browser)
assert.deepEqual(before.machine, after.machine)
assert.deepEqual(before.viewport, after.viewport)
assert.deepEqual(before.network, after.network)
assert.equal(before.sceneSamplesOverride, after.sceneSamplesOverride)
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}
const metrics = (trials) => ({
  loadingMs: median(trials.map((t) => t.firstFrame)),
  preparedAtMs: median(trials.map((t) => t.preparedAt)),
  fadeMs: median(trials.map((t) => t.firstFrame - t.preparedAt)),
  frameP95Ms: median(trials.map((t) => t.frameP95)),
  baseLightingStartMs: median(
    trials.map(
      (t) => t.assets.find((a) => /bake-00-lightmap-/.test(a.url))?.start
    )
  ),
  matcapDownloads: median(
    trials.map(
      (t) =>
        new Set(
          t.assets
            .filter((a) => /\/matcap-/.test(a.url) && a.transfer > 0)
            .map((a) => a.url)
        ).size
    )
  )
})
const rows = [...new Set(before.trials.map((t) => t.route))].flatMap((route) =>
  ["cold", "warm"].map((cache) => {
    const select = (report) =>
      report.trials.filter((t) => t.route === route && t.cache === cache)
    const oldTrials = select(before),
      newTrials = select(after)
    for (const trials of [oldTrials, newTrials]) {
      assert.ok(
        trials.length >= 5,
        `${route} ${cache}: need at least five trials`
      )
      assert.ok(
        trials.every(
          (t) =>
            !t.failed && !t.errors.length && t.firstFrame > 0 && t.frameP95 > 0
        )
      )
      assert.ok(
        trials.every(
          (t) =>
            t.preparedAt > 0 &&
            t.preparedAt <= t.firstFrame &&
            t.assets.some(
              (asset) =>
                /bake-00-lightmap-/.test(asset.url) &&
                Number.isFinite(asset.start)
            )
        ),
        `${route} ${cache}: missing preparation or lighting timing`
      )
    }
    const old = metrics(oldTrials),
      current = metrics(newTrials)
    const loadingChange = current.loadingMs / old.loadingMs - 1
    const frameChange = current.frameP95Ms / old.frameP95Ms - 1
    return {
      route,
      cache,
      before: old,
      after: current,
      loadingChange,
      frameChange,
      loadingPass: loadingChange <= 0.05,
      framePass: frameChange <= 0.05
    }
  })
)
const result = {
  backend: before.label,
  rows,
  passed: rows.every((r) => r.loadingPass && r.framePass)
}
if (outputPath)
  await writeFile(outputPath, JSON.stringify(result, null, 2) + "\n")
console.log(JSON.stringify(result, null, 2))
if (!result.passed) process.exitCode = 1
