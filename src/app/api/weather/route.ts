import * as Sentry from "@sentry/nextjs"
import { NextResponse } from "next/server"

import { getWeatherData, type WeatherApiResponse } from "./weather-data"

export async function GET() {
  try {
    const data = await getWeatherData()
    return NextResponse.json<WeatherApiResponse>(
      { ok: true, ...data },
      {
        headers: {
          "Cache-Control":
            "public, max-age=0, s-maxage=300, stale-while-revalidate=600"
        }
      }
    )
  } catch (error) {
    console.error("Weather fetch failed:", error)
    Sentry.captureException(error)
    return NextResponse.json<WeatherApiResponse>(
      { ok: false },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=60" } }
    )
  }
}
