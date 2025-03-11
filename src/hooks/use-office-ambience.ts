import { useCurrentScene } from "./use-current-scene"
import { useOfficeAmbience as useOfficeAmbienceHook } from "./use-site-audio"

export function useOfficeAmbience() {
  const scene = useCurrentScene()
  const isPeople = scene === "people"
  const isBlog = scene === "blog"
  const desiredVolume = isPeople ? 0.25 : isBlog ? 0.15 : 0.05

  useOfficeAmbienceHook(desiredVolume)
}
