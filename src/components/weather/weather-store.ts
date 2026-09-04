import { create } from "zustand"

import type { WeatherApiData } from "@/app/api/weather/weather-data"

export type WeatherSource = "fallback" | "live" | "override"

interface WeatherState {
  // Effective targets the scene consumes; the rendering side lerps.
  isRaining: boolean
  isThunderstorm: boolean
  /**
   * 0..1 curtain/sky strength while raining. Holds the last meaningful value
   * when dry so a lobo-forced rain has a sensible density.
   */
  rainIntensity: number
  /** 0..1 */
  cloudCover: number
  /** km/h */
  windSpeed: number

  live: WeatherApiData | null
  /** Lobo marino click; null = follow live. Never persisted. */
  rainOverride: boolean | null
  source: WeatherSource
  fetchedAt: number | null
}

// This module is imported from SSR'd client components (AppHooks), so it must
// stay free of three.js imports and nondeterministic initial state.
export const useWeather = create<WeatherState>(() => ({
  isRaining: false,
  isThunderstorm: false,
  rainIntensity: 0.7,
  cloudCover: 0.2,
  windSpeed: 10,
  live: null,
  rainOverride: null,
  source: "fallback",
  fetchedAt: null
}))

export function applyLiveWeather(data: WeatherApiData) {
  useWeather.setState((s) => {
    // Once live agrees with an active override the two are indistinguishable —
    // drop the override and follow live again.
    const rainOverride =
      s.rainOverride === data.isRaining ? null : s.rainOverride
    const isRaining = rainOverride ?? data.isRaining
    return {
      live: data,
      fetchedAt: data.fetchedAt,
      rainOverride,
      source: rainOverride !== null ? "override" : "live",
      isRaining,
      isThunderstorm: isRaining && data.isThunderstorm,
      rainIntensity:
        data.rainIntensity > 0.05 ? data.rainIntensity : s.rainIntensity,
      cloudCover: data.cloudCover,
      windSpeed: data.windSpeed
    }
  })
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  ;(window as unknown as Record<string, unknown>).__weather = useWeather
}

export function toggleRainOverride() {
  useWeather.setState((s) => {
    const next = !s.isRaining
    const liveRain = s.live?.isRaining ?? false
    const rainOverride = next === liveRain && s.live ? null : next
    return {
      rainOverride,
      isRaining: next,
      isThunderstorm: next && (s.live?.isThunderstorm ?? false),
      source: rainOverride !== null ? "override" : s.live ? "live" : "fallback"
    }
  })
}
