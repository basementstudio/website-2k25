import { create } from "zustand"

import type { WeatherApiData } from "@/app/api/weather/weather-data"
import {
  SKY_WEATHER_PRESETS,
  type SkyWeatherPreset
} from "@/components/sky/presets"
import { skyDebug } from "@/components/sky/sky-settings"

export type WeatherSource = "fallback" | "live" | "override"
type Conditions = Pick<
  WeatherApiData,
  "isRaining" | "isThunderstorm" | "rainIntensity" | "cloudCover" | "windSpeed"
>

interface WeatherState extends Conditions {
  preset: SkyWeatherPreset | "custom"
  live: WeatherApiData | null
  liveStatus: "loading" | "ready" | "error"
  source: WeatherSource
  fetchedAt: number | null
}

export const FALLBACK_WEATHER: Conditions = {
  isRaining: false,
  isThunderstorm: false,
  rainIntensity: 0.7,
  cloudCover: 0.2,
  windSpeed: 10
}

const conditionsFrom = (data: Conditions): Conditions => ({
  isRaining: data.isRaining,
  isThunderstorm: data.isThunderstorm,
  rainIntensity: data.rainIntensity,
  cloudCover: data.cloudCover,
  windSpeed: data.windSpeed
})

export const useWeather = create<WeatherState>(() => ({
  ...FALLBACK_WEATHER,
  preset: "live",
  live: null,
  liveStatus: "loading",
  source: "fallback",
  fetchedAt: null
}))

export function applyLiveWeather(data: WeatherApiData) {
  useWeather.setState((s) => ({
    live: data,
    fetchedAt: data.fetchedAt,
    liveStatus: "ready",
    ...(s.preset === "live"
      ? { ...conditionsFrom(data), source: "live" as const }
      : {})
  }))
}

export function applyWeatherPreset(preset: SkyWeatherPreset) {
  skyDebug.current.overrideWeather = false
  useWeather.setState((s) => ({
    ...conditionsFrom(
      preset === "live"
        ? (s.live ?? FALLBACK_WEATHER)
        : SKY_WEATHER_PRESETS[preset]
    ),
    preset,
    source: preset === "live" ? (s.live ? "live" : "fallback") : "override"
  }))
}

export function applyCustomWeather(conditions: Partial<Conditions>) {
  useWeather.setState((s) => {
    const next = { ...conditionsFrom(s), ...conditions }
    return {
      ...next,
      isThunderstorm: next.isRaining && next.isThunderstorm,
      preset: "custom",
      source: "override"
    }
  })
}

export function toggleRainOverride() {
  skyDebug.current.overrideWeather = false
  const s = useWeather.getState()
  const isRaining = !s.isRaining
  applyCustomWeather({
    isRaining,
    isThunderstorm: false,
    rainIntensity: isRaining ? Math.max(s.rainIntensity, 0.7) : 0
  })
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  ;(window as unknown as Record<string, unknown>).__weather = useWeather
}
