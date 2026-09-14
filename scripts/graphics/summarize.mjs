/** Aggregate trials without silently dropping failures or combining cold/warm loads. */
import { readFile, writeFile } from "node:fs/promises"
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b),
    n = sorted.length
  return n
    ? (sorted[Math.floor((n - 1) / 2)] + sorted[Math.floor(n / 2)]) / 2
    : null
}
const reports = []
for (const path of process.argv.slice(2)) {
  const report = JSON.parse(await readFile(path, "utf8")),
    rows = []
  for (const route of [...new Set(report.trials.map((t) => t.route))])
    for (const cache of ["cold", "warm"]) {
      const trials = report.trials.filter(
        (t) => t.route === route && t.cache === cache
      )
      if (!trials.length) continue
      const failed = trials.filter((t) => t.failed || t.errors.length)
      rows.push({
        route,
        cache,
        trials: trials.length,
        failed: failed.length,
        ...Object.fromEntries(
          [
            "firstFrame",
            "initialBytes",
            "initialDecodedBytes",
            "networkBytesAtFirstFrame",
            "frameP50",
            "frameP95",
            "lcp",
            "cls",
            "ttfb"
          ].map((key) => [
            key,
            median(
              trials.map((t) => t[key]).filter((v) => typeof v === "number")
            )
          ])
        )
      })
    }
  reports.push({
    label: report.label,
    source: path,
    machine: report.machine,
    browser: report.browser,
    rows
  })
}
const output = JSON.stringify(reports, null, 2)
if (process.env.OUTPUT) await writeFile(process.env.OUTPUT, output)
else console.log(output)
