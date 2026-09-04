"use client"

import { useSearchParams } from "next/navigation"

import { USE_KTX2_LIGHTMAPS_LAMP } from "@/components/lamp"
import { USE_KTX2_LIGHTMAPS } from "@/components/map/bakes"

/**
 * Shows which lightmap format is actually active right now — the atlas
 * (bakes.tsx) and the blog lamp's on/off bakes (lamp/index.tsx) are
 * separate flags and can in theory drift out of sync. Same ?debug gate as
 * the rest of src/components/debug.
 */
export const LightmapFormatPanel = () => {
  const searchParams = useSearchParams()

  if (!searchParams.has("debug")) return null

  const bothMatch = USE_KTX2_LIGHTMAPS === USE_KTX2_LIGHTMAPS_LAMP

  return (
    <div className="pointer-events-none fixed left-4 top-4 z-50 rounded bg-black/80 px-3 py-2 font-mono text-[11px] leading-relaxed text-white">
      <div>atlas: {USE_KTX2_LIGHTMAPS ? "KTX2" : "EXR"}</div>
      <div>lamp: {USE_KTX2_LIGHTMAPS_LAMP ? "KTX2" : "EXR"}</div>
      {!bothMatch && <div className="text-yellow-400">⚠ mismatched</div>}
    </div>
  )
}
