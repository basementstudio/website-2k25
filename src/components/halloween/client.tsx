import { useState } from "react"

import { useDeviceDetect } from "@/hooks/use-device-detect"

import { HalloweenBats } from "./bats"
import { HalloweenCandles } from "./candles"
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

  return (
    <>
      <HalloweenSpiders />
      <HalloweenWebs />
      <HalloweenCandles />
      <HalloweenPumpkins reducedMotion={reducedMotion} />
      <HalloweenPortraits reducedMotion={reducedMotion} />
      <HalloweenGhosts />
      {!reducedMotion && <HalloweenBats />}
      {!reducedMotion && <HalloweenStorm />}
      {/* Raymarched per pixel in the post pass — desktop only, like Sparkles. */}
      {!isMobile && <HalloweenFog />}
    </>
  )
}
