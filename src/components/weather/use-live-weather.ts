"use client"

import { useEffect } from "react"

import type { WeatherApiResponse } from "@/app/api/weather/weather-data"

import { applyLiveWeather } from "./weather-store"

const POLL_MS = 10 * 60 * 1000

/**
 * Polls /api/weather while the tab is visible. Failures keep the previous
 * conditions — the server reports its own upstream errors to Sentry.
 */
export function useLiveWeather() {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    let lastAttempt = 0
    const controller = new AbortController()

    const tick = async () => {
      lastAttempt = Date.now()
      try {
        const res = await fetch("/api/weather", { signal: controller.signal })
        const data: WeatherApiResponse = await res.json()
        if (data.ok) applyLiveWeather(data)
        else console.warn("Weather API degraded; keeping previous conditions")
      } catch (error) {
        if (!controller.signal.aborted)
          console.warn("Weather fetch failed:", error)
      }
    }

    const start = () => {
      if (timer) return
      if (Date.now() - lastAttempt > POLL_MS) tick()
      timer = setInterval(tick, POLL_MS)
    }
    const stop = () => {
      clearInterval(timer)
      timer = undefined
    }
    const onVisibility = () =>
      document.visibilityState === "visible" ? start() : stop()

    start()
    document.addEventListener("visibilitychange", onVisibility, {
      passive: true
    })
    return () => {
      stop()
      document.removeEventListener("visibilitychange", onVisibility)
      controller.abort()
    }
  }, [])
}
