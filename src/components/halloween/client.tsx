import { useDeviceDetect } from "@/hooks/use-device-detect"

import { HalloweenFog } from "./fog"
import { HalloweenGhosts } from "./ghosts"
import { HalloweenSpiders } from "./spiders"

export const ClientHalloween = () => {
  const { isMobile } = useDeviceDetect()

  return (
    <>
      <HalloweenSpiders />
      <HalloweenGhosts />
      {/* Raymarched per pixel in the post pass — desktop only, like Sparkles. */}
      {!isMobile && <HalloweenFog />}
    </>
  )
}
