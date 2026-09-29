import { useEffect, useRef } from "react"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { skyState } from "@/components/sky/sky-state"
import {
  applyWeatherPreset,
  useWeather
} from "@/components/weather/weather-store"
import { STORM } from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import {
  lightFlickerUniform,
  lightningUniform
} from "@/shaders/material-global-shader"

// Power-cut choreography as [seconds from start, light level] keyframes,
// held until the next one. Dips are ≥ 1/3 s apart so the whole-screen
// flicker stays under WCAG 2.3.1's three-flashes-per-second limit.
const powerCut = (outFor: number): [number, number][] => [
  [0, 0.35],
  [0.12, 1],
  [0.5, 0.25],
  [0.66, 0.9],
  [1.05, STORM.blackout],
  [1.05 + outFor, 0.45],
  [1.4 + outFor, STORM.blackout],
  [1.75 + outFor, 1]
]

const levelAt = (keys: [number, number][], t: number) => {
  let level = 1
  for (const [at, value] of keys) {
    if (t < at) break
    level = value
  }
  return level
}

// Turns the real-weather thunderstorm on (the sky already draws rain and
// lightning for it) and brings the storm indoors: every strike lights the
// office, and some of them knock the power out for a moment.
export const HalloweenStorm = () => {
  const { fadeFactor } = useFadeAnimation()
  const state = useRef({
    wasFlashing: false,
    cut: null as { start: number; keys: [number, number][] } | null,
    level: 1
  })

  useEffect(() => {
    const previous = useWeather.getState().preset
    applyWeatherPreset("thunderstorm")
    return () => {
      applyWeatherPreset(previous === "custom" ? "live" : previous)
      lightFlickerUniform.value = 1
      lightningUniform.value = 0
    }
  }, [])

  useFrameCallback((_, delta, time) => {
    const s = state.current

    // Dev handle for tuning: `__halloweenStorm.force = { flash: 1, level: 1 }`
    // pins both values; `null` hands control back to the storm.
    if (process.env.NODE_ENV !== "production") {
      const w = window as unknown as Record<string, any>
      const handle = (w.__halloweenStorm ??= { force: null })
      if (handle.force) {
        lightFlickerUniform.value = handle.force.level
        lightningUniform.value = handle.force.flash
        return
      }
    }
    // Hold the storm back while something is being inspected.
    const calm = 1 - fadeFactor.current.get()
    const flash = skyState.lightning

    // A strike just landed: maybe take the lights down with it.
    const flashing = flash > 0.5
    if (flashing && !s.wasFlashing && !s.cut && calm > 0.99) {
      if (Math.random() < STORM.powerCutChance) {
        s.cut = {
          start: time + 0.15,
          keys: powerCut(STORM.outFor[0] + Math.random() * STORM.outFor[1])
        }
      }
    }
    s.wasFlashing = flashing

    let target = 1
    if (s.cut) {
      const t = time - s.cut.start
      const end = s.cut.keys[s.cut.keys.length - 1][0]
      if (t > end) s.cut = null
      else if (t >= 0) target = levelAt(s.cut.keys, t)
    }
    // Quick but not instant — fluorescent tubes don't snap.
    s.level += (target - s.level) * Math.min(1, delta * 30)

    lightFlickerUniform.value = 1 - (1 - s.level) * calm
    lightningUniform.value = flash * STORM.lightningIndoor * calm
  })

  return null
}
