import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { memo, Suspense } from "react"

import { LightmapFormatPanel } from "./lightmap-format-panel"
import { PerfStatsPanel } from "./perf-stats-panel"

const OnlyDebug = dynamic(
  () => import("./only-debug").then((mod) => mod.OnlyDebug),
  {
    ssr: false,
    loading: () => null
  }
)

const DebugInner = () => {
  const searchParams = useSearchParams()
  const debug = searchParams.has("debug")

  if (!debug) return null

  return (
    <>
      <div className="w-128 absolute bottom-4 right-4 z-50">
        <Suspense fallback={null}>
          <OnlyDebug />
        </Suspense>
      </div>
      <PerfStatsPanel />
      <LightmapFormatPanel />
    </>
  )
}

export const Debug = memo(DebugInner)
