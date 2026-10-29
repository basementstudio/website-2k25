import { useEffect, useState } from "react"

import { LIGHTMAP_TINT } from "@/constants/halloween"
import { useDeviceDetect } from "@/hooks/use-device-detect"
import { lightmapTintUniform } from "@/shaders/material-global-shader"

import { HalloweenCandles } from "./candles"
import { HalloweenCat } from "./cat"
import { HalloweenFog } from "./fog"
import { HalloweenGhosts } from "./ghosts"
import { HalloweenPortraits } from "./portraits"
import { HalloweenPumpkins } from "./pumpkins"
import { HalloweenSpiders } from "./spiders"
import { HalloweenStorm } from "./storm"
import { HalloweenWebs } from "./webs"

export const ClientHalloween = () => {
  const { isMobile } = useDeviceDetect()
  // Lightning and power cuts flash the whole screen — skip them for anyone
  // who asked the OS for less motion.
  const [reducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )

  // Only tint the lightmaps while the season is mounted, so the office goes
  // back to its normal bakes once Halloween is over.
  useEffect(() => {
    lightmapTintUniform.value.set(...LIGHTMAP_TINT)
    return () => {
      lightmapTintUniform.value.set(1, 1, 1)
    }
  }, [])

  return (
    <>
      <HalloweenSpiders />
      <HalloweenWebs />
      <HalloweenCandles reducedMotion={reducedMotion} />
      <HalloweenCat reducedMotion={reducedMotion} />
      <HalloweenPumpkins reducedMotion={reducedMotion} />
      <HalloweenPortraits reducedMotion={reducedMotion} />
      <HalloweenGhosts reducedMotion={reducedMotion} />
      {!reducedMotion && <HalloweenStorm />}
      {/* Raymarched per pixel in the post pass — desktop only, like Sparkles. */}
      {!isMobile && <HalloweenFog />}
    </>
  )
}
