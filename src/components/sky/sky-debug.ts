// Compatibility entry point for the developer console and Leva controls.
import { applyWeatherPreset } from "@/components/weather/weather-store"

import { skyDebug } from "./sky-settings"
import { applyTimePreset } from "./time-store"

export type { SkyTimePreset, SkyWeatherPreset } from "./presets"
export { SKY_TIME_PRESETS, SKY_WEATHER_PRESETS } from "./presets"
export { applyTimePreset, applyWeatherPreset, skyDebug }

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  const w = window as unknown as Record<string, unknown>
  w.__skyDebug = skyDebug
  w.__skyPresets = { applyTimePreset, applyWeatherPreset }
}
