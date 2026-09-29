import { useState } from "react"

import { useDeviceDetect } from "@/hooks/use-device-detect"

import { HalloweenFog } from "./fog"
import { HalloweenGhosts } from "./ghosts"
import { HalloweenSpiders } from "./spiders"
import { HalloweenStorm } from "./storm"

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
      <HalloweenGhosts />
      {!reducedMotion && <HalloweenStorm />}
      {/* Raymarched per pixel in the post pass — desktop only, like Sparkles. */}
      {!isMobile && <HalloweenFog />}
    </>
  )
}
