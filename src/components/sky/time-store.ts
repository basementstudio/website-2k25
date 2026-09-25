import { create } from "zustand"

import { ArgentinaTime } from "@/utils/argentina-time"

import { SKY_TIME_PRESETS, type SkyTimePreset } from "./presets"
import { skyDebug } from "./sky-settings"

export const useSceneTime = create<{ preset: SkyTimePreset }>(() => ({
  preset: "live"
}))

export function applyTimePreset(preset: SkyTimePreset) {
  skyDebug.current.overrideSun = false
  skyDebug.current.timeScale = 1
  useSceneTime.setState({ preset })
}

export function getSceneTime(preset = useSceneTime.getState().preset) {
  if (preset === "live") return ArgentinaTime()
  const { hours, minutes } = SKY_TIME_PRESETS[preset]
  return { hours, minutes, seconds: 0 }
}

export function formatSceneTime(preset = useSceneTime.getState().preset) {
  const { hours, minutes, seconds } = getSceneTime(preset)
  const minuteAndSecond = [minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":")
  const period = hours % 24 < 12 ? "AM" : "PM"
  return `${hours % 12 || 12}:${minuteAndSecond} ${period}`
}
