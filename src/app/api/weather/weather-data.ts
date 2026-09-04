import { cacheLife } from "next/cache"

import { MAR_DEL_PLATA } from "@/lib/constants"

export interface WeatherApiData {
  isRaining: boolean
  isThunderstorm: boolean
  /** 0..1 — how heavy the precipitation looks (drizzle ≪ storm). */
  rainIntensity: number
  /** 0..1 */
  cloudCover: number
  /** km/h */
  windSpeed: number
  /** Raw WMO code, kept for future flavor (lightning, snow, ...). */
  weatherCode: number
  /** °C */
  temperature: number
  /** Epoch ms at cache fill. */
  fetchedAt: number
}

export type WeatherApiResponse = ({ ok: true } & WeatherApiData) | { ok: false }

const OPEN_METEO_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${MAR_DEL_PLATA.lat}&longitude=${MAR_DEL_PLATA.lon}` +
  `&current=temperature_2m,weather_code,cloud_cover,precipitation,rain,wind_speed_10m`

// WMO groups: 51-57 drizzle, 61-67 rain, 71-77 snow, 80-86 showers,
// 95-99 thunderstorm. Snow renders as the rain curtains (rare in MDQ anyway).
const isPrecipCode = (c: number) => (c >= 51 && c <= 86) || c >= 95
const isThunderCode = (c: number) => c >= 95 && c <= 99

const rainIntensityForCode = (c: number, precipMm: number): number => {
  if (c >= 96) return 1
  if (c === 95) return 0.9
  if (c === 65 || c === 66 || c === 67 || c === 82) return 1
  if (c === 63 || c === 81 || c === 86) return 0.8
  if (c === 61 || c === 80 || c === 85) return 0.55
  if (c >= 71 && c <= 77) return 0.5
  if (c >= 51 && c <= 57) return 0.35
  if (precipMm > 0) return Math.min(1, 0.4 + precipMm * 0.2)
  return 0
}

/**
 * Live weather can't be tag-revalidated (there is no publish webhook for the
 * sky), so this is the repo's one deliberately time-based cache — see the
 * revalidation note in AGENTS.md. The explicit profile matters: the config
 * default is the ~1-year Sanity one.
 *
 * Throws on upstream failure instead of returning a marker: a failed
 * background revalidation then keeps serving the last good entry rather than
 * caching the outage for the next window.
 */
export async function getWeatherData(): Promise<WeatherApiData> {
  "use cache"
  cacheLife({ stale: 300, revalidate: 600, expire: 3600 })

  const res = await fetch(OPEN_METEO_URL, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`)

  const { current } = await res.json()
  const code: number = current.weather_code
  const isRaining =
    isPrecipCode(code) || current.rain > 0 || current.precipitation > 0

  return {
    isRaining,
    isThunderstorm: isThunderCode(code),
    rainIntensity: isRaining
      ? Math.max(rainIntensityForCode(code, current.precipitation), 0.3)
      : 0,
    cloudCover: Math.min(Math.max(current.cloud_cover / 100, 0), 1),
    windSpeed: current.wind_speed_10m,
    weatherCode: code,
    temperature: current.temperature_2m,
    fetchedAt: Date.now()
  }
}
