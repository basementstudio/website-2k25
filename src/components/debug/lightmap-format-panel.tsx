"use client"

import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { USE_KTX2_LIGHTMAPS_LAMP } from "@/components/lamp"
import { USE_KTX2_LIGHTMAPS } from "@/components/map/bakes"
import {
  atlasAoIntensity,
  atlasLightmapGamma,
  atlasLightmapIntensity,
  atlasLightmapSaturation
} from "@/components/map/lightmap-settings"

/**
 * Shows which lightmap format is actually active right now — the atlas
 * (bakes.tsx) and the blog lamp's on/off bakes (lamp/index.tsx) are
 * separate flags and can in theory drift out of sync. Same ?debug gate as
 * the rest of src/components/debug.
 */
export const LightmapFormatPanel = () => {
  const searchParams = useSearchParams()
  const [intensity, setIntensity] = useState(atlasLightmapIntensity.value)
  const [saturation, setSaturation] = useState(atlasLightmapSaturation.value)
  const [aoIntensity, setAoIntensity] = useState(atlasAoIntensity.value)
  const [gamma, setGamma] = useState(atlasLightmapGamma.value)

  if (!searchParams.has("debug")) return null

  // Cast widens away the literal-boolean type so this still type-checks
  // when both flags currently happen to be hardcoded to the same value.
  const bothMatch = (USE_KTX2_LIGHTMAPS as boolean) === USE_KTX2_LIGHTMAPS_LAMP

  return (
    <div className="pointer-events-none fixed left-4 top-4 z-50 rounded bg-black/80 px-3 py-2 font-mono text-[11px] leading-relaxed text-white">
      <div>atlas: {USE_KTX2_LIGHTMAPS ? "KTX2" : "EXR"}</div>
      <div>lamp: {USE_KTX2_LIGHTMAPS_LAMP ? "KTX2" : "EXR"}</div>
      <label className="pointer-events-auto mt-2 flex flex-col gap-1">
        <span>Map00: {Math.round(intensity * 100)}%</span>
        <input
          type="range"
          min={0}
          max={5}
          step={0.05}
          value={intensity}
          onChange={(event) => {
            const value = event.currentTarget.valueAsNumber
            atlasLightmapIntensity.value = value
            setIntensity(value)
          }}
        />
      </label>
      <label className="pointer-events-auto mt-2 flex flex-col gap-1">
        <span>Map00 saturation: {Math.round(saturation * 100)}%</span>
        <input
          type="range"
          min={0}
          max={2}
          step={0.05}
          value={saturation}
          onChange={(event) => {
            const value = event.currentTarget.valueAsNumber
            atlasLightmapSaturation.value = value
            setSaturation(value)
          }}
        />
      </label>
      <label className="pointer-events-auto mt-2 flex flex-col gap-1">
        <span>Map00 AO: {Math.round(aoIntensity * 100)}%</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={aoIntensity}
          onChange={(event) => {
            const value = event.currentTarget.valueAsNumber
            atlasAoIntensity.value = value
            setAoIntensity(value)
          }}
        />
      </label>
      <label className="pointer-events-auto mt-2 flex flex-col gap-1">
        <span>Map00 gamma: {gamma.toFixed(2)}</span>
        <input
          type="range"
          min={0.25}
          max={3}
          step={0.05}
          value={gamma}
          onChange={(event) => {
            const value = event.currentTarget.valueAsNumber
            atlasLightmapGamma.value = value
            setGamma(value)
          }}
        />
      </label>
      {!bothMatch && <div className="text-yellow-400">⚠ mismatched</div>}
    </div>
  )
}
