import * as Sentry from "@sentry/nextjs"
import { DefaultLoadingManager } from "three"

// Assumes one boot per page load, which holds because `isCanvasInPage` is
// sticky and `canRunMainApp` only ever goes false -> true. A retry-boot feature
// would need this module's one-shot guards (`marks`, `deadlineFired`) revisited.
// map-ready and bakes-resolved are concurrent; the reveal waits for both.
export type BootStage =
  | "worker-spawned"
  | "scene-chunk"
  | "offscreen-ready"
  | "map-ready"
  | "bakes-resolved"

const BOOT_ASSET_PATH = "/3d/"
const TRANSCODER_PATH = "/basis-transcoder/"

let startedAt = 0
let wasHidden = false
let recoveryReported = false
const marks: Partial<Record<BootStage, number>> = {}

const inFlight = new Set<string>()
let restoreManager: (() => void) | null = null

// Resource timing lists only completed requests, and the preload hints miss
// what boot actually blocks on (use-preload-assets.ts excludes MAP_MODEL_KEYS
// and matcaps, both of which gate <Bakes/>). The loading manager sees every
// useLoader and KTX2Loader.loadAsync. Patch itemStart/itemEnd, not
// onStart/onLoad: drei's Progress module owns those handler slots.
const trackLoaderRequests = () => {
  const manager = DefaultLoadingManager
  const { itemStart, itemEnd, itemError } = manager

  manager.itemStart = (url) => {
    inFlight.add(url)
    itemStart.call(manager, url)
  }
  manager.itemEnd = (url) => {
    inFlight.delete(url)
    itemEnd.call(manager, url)
  }
  manager.itemError = (url) => {
    inFlight.delete(url)
    itemError.call(manager, url)
  }

  restoreManager = () => {
    manager.itemStart = itemStart
    manager.itemEnd = itemEnd
    manager.itemError = itemError
  }
}

let visibleSince: number | null = null
let visibleAccum = 0

let deadlineBudget = 0
let deadlineExpire: (() => void) | null = null
let deadlineTimer: ReturnType<typeof setTimeout> | null = null
let deadlineFired = false

const visibleElapsed = () =>
  Math.round(
    visibleAccum +
      (visibleSince === null ? 0 : performance.now() - visibleSince)
  )

const toSeconds = (ms: number) => Number((ms / 1000).toFixed(2))

const armDeadline = () => {
  if (deadlineFired || deadlineExpire === null) return
  if (visibleSince === null || deadlineTimer !== null) return

  deadlineTimer = setTimeout(
    () => {
      deadlineTimer = null
      deadlineFired = true
      deadlineExpire?.()
    },
    Math.max(0, deadlineBudget - visibleElapsed())
  )
}

const disarmDeadline = () => {
  if (deadlineTimer === null) return
  clearTimeout(deadlineTimer)
  deadlineTimer = null
}

// Also called on (re)subscribe, so a change missed while detached still lands.
const syncVisibility = () => {
  if (document.visibilityState === "hidden") {
    wasHidden = true
    if (visibleSince !== null) {
      visibleAccum += performance.now() - visibleSince
      visibleSince = null
    }
    disarmDeadline()
  } else if (visibleSince === null) {
    visibleSince = performance.now()
    armDeadline()
  }
}

// The clock starts once, but the subscriptions must survive the effect
// re-running: tearing them down without re-attaching would freeze the visible
// clock, and the deadline with it.
export const startCanvasBootTrace = () => {
  if (startedAt === 0) {
    startedAt = performance.now()
    wasHidden = document.visibilityState === "hidden"
    visibleSince = wasHidden ? null : startedAt
  }

  if (restoreManager !== null) return
  document.addEventListener("visibilitychange", syncVisibility)
  trackLoaderRequests()
  syncVisibility()
}

// Charged only while the tab is visible. A tab opened with cmd+click gets
// throttled rAF and a worker that never runs its transition, so wall-clock time
// there reports a failure nobody saw — and a tab never looked at never expires.
export const armCanvasBootDeadline = (
  budgetMs: number,
  onExpire: () => void
) => {
  // deadlineFired is never reset: re-arming after it expired would file twice.
  deadlineBudget = budgetMs
  deadlineExpire = onExpire
  armDeadline()
}

export const stopCanvasBootTrace = () => {
  document.removeEventListener("visibilitychange", syncVisibility)
  disarmDeadline()
  deadlineExpire = null
  restoreManager?.()
  restoreManager = null
}

export const markCanvasBootStage = (stage: BootStage) => {
  if (marks[stage] !== undefined) return
  if (startedAt === 0) startCanvasBootTrace()

  marks[stage] = toSeconds(performance.now() - startedAt)
  Sentry.addBreadcrumb({
    category: "canvas.boot",
    message: stage,
    level: "info",
    data: { atSec: marks[stage] }
  })
}

// Each stage is written once, at the moment it happens, so the object's own key
// order is already chronological — including the scene-chunk/worker-spawned race.
const lastStage = (): BootStage | "none" => {
  const seen = Object.keys(marks) as BootStage[]
  return seen[seen.length - 1] ?? "none"
}

interface NavigatorWithHints extends Navigator {
  connection?: {
    effectiveType?: string
    downlink?: number
    rtt?: number
    saveData?: boolean
  }
  deviceMemory?: number
}

interface PerformanceWithMemory extends Performance {
  memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number }
}

// `connection` and `deviceMemory` are Chromium-only; `deviceMemory` caps at 8.
const deviceSnapshot = () => {
  const nav = navigator as NavigatorWithHints
  const mem = (performance as PerformanceWithMemory).memory

  return {
    cpuCores: nav.hardwareConcurrency,
    deviceMemoryGb: nav.deviceMemory,
    dpr: window.devicePixelRatio,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    effectiveType: nav.connection?.effectiveType,
    downlinkMbps: nav.connection?.downlink,
    rttMs: nav.connection?.rtt,
    saveData: nav.connection?.saveData,
    usedHeapMb: mem ? Math.round(mem.usedJSHeapSize / 1e6) : undefined,
    heapLimitMb: mem ? Math.round(mem.jsHeapSizeLimit / 1e6) : undefined
  }
}

const memoryBucket = (gb: number | undefined) => {
  if (gb === undefined) return "unknown"
  if (gb <= 2) return "<=2"
  if (gb <= 4) return "4"
  return ">=8"
}

const pending = () => ({
  outstanding: inFlight.size,
  outstandingUrls: Array.from(inFlight)
    .slice(0, 5)
    .map((url) => url.slice(url.lastIndexOf("/") + 1))
})

// Reads the existing resource-timing buffer, so nothing is instrumented at
// request time. Only called once boot has already failed.
const assetSnapshot = () => {
  const resources = performance.getEntriesByType(
    "resource"
  ) as PerformanceResourceTiming[]

  const entries = resources.filter((entry) =>
    entry.name.includes(BOOT_ASSET_PATH)
  )
  const base = {
    completed: entries.length,
    ...pending(),
    transcoderLoaded: resources.some((entry) =>
      entry.name.includes(TRANSCODER_PATH)
    )
  }

  if (entries.length === 0) return { ...base, sinceLastAssetSec: undefined }

  let bytes = 0
  let cached = 0
  let firstStart = Infinity
  let lastResponseEnd = 0

  for (const entry of entries) {
    bytes += entry.transferSize
    if (entry.transferSize === 0 && entry.decodedBodySize > 0) cached++
    if (entry.startTime < firstStart) firstStart = entry.startTime
    if (entry.responseEnd > lastResponseEnd) lastResponseEnd = entry.responseEnd
  }

  // Wall-clock window, not the sum of per-request durations: the assets
  // download concurrently, so summing them divides throughput by roughly the
  // number of parallel connections.
  const windowMs = lastResponseEnd - firstStart

  // Strings, not objects: Sentry's normalizeDepth (3) renders those "[Object]".
  const slowest = entries
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5)
    .map(
      (entry) =>
        `${toSeconds(entry.duration)}s ${Math.round(entry.transferSize / 1024)}kb ${entry.name.slice(entry.name.indexOf(BOOT_ASSET_PATH))}`
    )

  return {
    ...base,
    cached,
    totalKb: Math.round(bytes / 1024),
    windowSec: toSeconds(windowMs),
    // Undefined rather than 0 on a warm cache, where transferSize is 0 for
    // every entry and the number would read as "no bandwidth".
    aggregateMbps:
      bytes > 0 && windowMs > 0
        ? Number(((bytes * 8) / (windowMs * 1000)).toFixed(2))
        : undefined,
    sinceLastAssetSec: toSeconds(performance.now() - lastResponseEnd),
    slowest
  }
}

// Never claims a post-download stall while a loader still has work outstanding.
const stallKind = (assets: ReturnType<typeof assetSnapshot>) => {
  if (assets.outstanding > 0) return "downloading"
  if (assets.completed === 0) return "no-assets"
  if (assets.sinceLastAssetSec !== undefined && assets.sinceLastAssetSec > 5) {
    return "post-download"
  }
  return "settling"
}

const commonFields = () => {
  const device = deviceSnapshot()
  const assets = assetSnapshot()

  return {
    assets,
    tags: {
      "boot.was_hidden": String(wasHidden),
      // Deliberately not `isbot` (used in proxy.ts): its UA table costs ~1.5KB
      // gzipped on every route, and lazy-loading it would mean fetching a chunk
      // over the network this timeout is trying to diagnose. `webdriver` alone
      // caught the only headless agent in the reported events.
      "boot.automated": String(navigator.webdriver === true),
      "net.effective_type": device.effectiveType ?? "unknown",
      "device.memory_bucket": memoryBucket(device.deviceMemoryGb)
    },
    contexts: { canvas_boot_assets: assets, canvas_boot_device: device }
  }
}

export const captureCanvasBootTimeout = (budgetMs: number) => {
  if (startedAt === 0) return

  const elapsedSec = toSeconds(performance.now() - startedAt)
  const { assets, tags, contexts } = commonFields()

  Sentry.captureMessage("Canvas boot timed out", {
    level: "warning",
    tags: {
      ...tags,
      "boot.last_stage": lastStage(),
      "boot.stall": stallKind(assets),
      "boot.transcoder_loaded": String(assets.transcoderLoaded)
    },
    contexts: {
      // Copied: Sentry serializes asynchronously, so a stage landing after the
      // timeout would otherwise appear to have beaten it.
      canvas_boot: {
        marks: { ...marks },
        elapsedSec,
        visibleSec: toSeconds(visibleElapsed()),
        budgetSec: toSeconds(budgetMs)
      },
      ...contexts
    }
  })
}

// Tells "hung" apart from "the budget is simply too short".
export const captureCanvasBootRecovery = () => {
  if (startedAt === 0 || recoveryReported) return
  recoveryReported = true

  const { tags, contexts } = commonFields()

  Sentry.captureMessage("Canvas boot recovered after timeout", {
    level: "info",
    tags,
    contexts: {
      canvas_boot: {
        marks: { ...marks },
        elapsedSec: toSeconds(performance.now() - startedAt),
        visibleSec: toSeconds(visibleElapsed())
      },
      ...contexts
    }
  })
}
