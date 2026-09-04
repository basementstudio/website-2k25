"use client"

import { useSearchParams } from "next/navigation"

import { usePerfStats } from "@/hooks/use-perf-stats"

/**
 * DOM-side readout of the numbers src/components/postprocessing/renderer.tsx
 * gathers from gl.info right after the main scene render. Renders outside
 * the canvas (alongside <Debug/>'s Leva panel), same ?debug gate as the
 * rest of src/components/debug.
 */
export const PerfStatsPanel = () => {
  const searchParams = useSearchParams()
  const stats = usePerfStats()

  if (!searchParams.has("debug")) return null

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-50 rounded bg-black/80 px-3 py-2 font-mono text-[11px] leading-relaxed text-white">
      <div>draw calls: {stats.calls}</div>
      <div>triangles: {stats.triangles.toLocaleString()}</div>
      <div>geometries: {stats.geometries}</div>
      <div>textures: {stats.textures}</div>
    </div>
  )
}
