import {
  applyLiveWeather,
  useWeather
} from "@/components/weather/weather-store"

import { SKY_YAW_OFFSET_DEG } from "./config"

// Mutable .current object read by the Sky frame callback, written by the
// leva controls behind ?debug (postprocessingDebug pattern).
export const skyDebug = {
  current: {
    overrideSun: false,
    elevation: 45,
    azimuth: 0,
    /** 1 = real time; crank up to time-lapse the whole day for QA. */
    timeScale: 1,
    yawOffset: SKY_YAW_OFFSET_DEG,
    overrideWeather: false,
    cloudCover: 0.2,
    rainFactor: 0,
    windSpeed: 10,
    sunIntensity: 20,
    sunDiscIntensity: 60
  }
}

// Compass azimuths are MDQ-plausible with yawOffset 0: the sun rises at the
// window's right (E≈80°), passes north (0° — straight out the window) and
// sets at its left (W≈280°).
export const SKY_TIME_PRESETS = {
  sunrise: { elevation: 0.5, azimuth: 80 },
  morning: { elevation: 25, azimuth: 45 },
  noon: { elevation: 45, azimuth: 0 },
  goldenHour: { elevation: 8, azimuth: 290 },
  sunset: { elevation: 0.5, azimuth: 280 },
  twilight: { elevation: -5, azimuth: 285 },
  night: { elevation: -30, azimuth: 200 },
  midnight: { elevation: -60, azimuth: 180 }
} as const

export type SkyTimePreset = keyof typeof SKY_TIME_PRESETS | "live"

// rainIntensity grades the curtains + sky darkening: drizzle ≪ storm.
export const SKY_WEATHER_PRESETS = {
  clear: {
    cloudCover: 0.05,
    rainIntensity: 0,
    windSpeed: 10,
    isRaining: false,
    isThunderstorm: false
  },
  partlyCloudy: {
    cloudCover: 0.4,
    rainIntensity: 0,
    windSpeed: 25,
    isRaining: false,
    isThunderstorm: false
  },
  windy: {
    cloudCover: 0.25,
    rainIntensity: 0,
    windSpeed: 90,
    isRaining: false,
    isThunderstorm: false
  },
  overcast: {
    cloudCover: 0.95,
    rainIntensity: 0,
    windSpeed: 20,
    isRaining: false,
    isThunderstorm: false
  },
  drizzle: {
    cloudCover: 0.75,
    rainIntensity: 0.3,
    windSpeed: 15,
    isRaining: true,
    isThunderstorm: false
  },
  lightRain: {
    cloudCover: 0.85,
    rainIntensity: 0.55,
    windSpeed: 22,
    isRaining: true,
    isThunderstorm: false
  },
  rain: {
    cloudCover: 0.95,
    rainIntensity: 0.8,
    windSpeed: 30,
    isRaining: true,
    isThunderstorm: false
  },
  thunderstorm: {
    cloudCover: 1,
    rainIntensity: 1,
    windSpeed: 60,
    isRaining: true,
    isThunderstorm: true
  }
} as const

export type SkyWeatherPreset = keyof typeof SKY_WEATHER_PRESETS | "live"

export function applyTimePreset(preset: SkyTimePreset) {
  const d = skyDebug.current
  if (preset === "live") {
    d.overrideSun = false
    return
  }
  const p = SKY_TIME_PRESETS[preset]
  d.overrideSun = true
  d.elevation = p.elevation
  d.azimuth = p.azimuth
}

export function applyWeatherPreset(preset: SkyWeatherPreset) {
  const d = skyDebug.current
  if (preset === "live") {
    d.overrideWeather = false
    const live = useWeather.getState().live
    if (live) applyLiveWeather(live)
    else
      useWeather.setState({
        isRaining: false,
        isThunderstorm: false,
        rainOverride: null,
        source: "fallback"
      })
    return
  }
  const p = SKY_WEATHER_PRESETS[preset]
  d.overrideWeather = true
  d.cloudCover = p.cloudCover
  d.rainFactor = p.rainIntensity
  d.windSpeed = p.windSpeed
  // Drive the real rain curtains + lobo tint too, not just the sky.
  useWeather.setState((s) => ({
    isRaining: p.isRaining,
    isThunderstorm: p.isThunderstorm,
    rainIntensity: p.isRaining ? p.rainIntensity : s.rainIntensity,
    rainOverride: null,
    source: "override"
  }))
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  const w = window as unknown as Record<string, unknown>
  w.__skyDebug = skyDebug
  w.__skyPresets = { applyTimePreset, applyWeatherPreset }
}
