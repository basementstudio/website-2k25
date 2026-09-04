"use client"

import { Leva, useControls } from "leva"
import { useEffect, useRef } from "react"

import {
  applyTimePreset,
  applyWeatherPreset,
  SKY_TIME_PRESETS,
  SKY_WEATHER_PRESETS,
  skyDebug,
  type SkyTimePreset,
  type SkyWeatherPreset
} from "@/components/sky/sky-debug"

import {
  postprocessingDebug,
  registerLevaSetters,
  useDebugCameraStore
} from "./debug-state"
import { ReactScan } from "./react-scan"

const onNumberChange =
  (write: (value: number) => void) =>
  (value: number, _path: string, context: { initial: boolean }) => {
    write(value)
    if (!context.initial) postprocessingDebug.hasChanged.current = true
  }

const CameraDebugControls = () => {
  const setFlyMode = useDebugCameraStore((state) => state.setFlyMode)

  useControls("camera", {
    flyMode: {
      value: false,
      onChange: setFlyMode
    }
  })

  useEffect(() => () => setFlyMode(false), [setFlyMode])

  return null
}

const SkyDebugControls = () => {
  // Presets write skyDebug directly; this pushes the new values back into the
  // sliders so the panel doesn't display stale numbers.
  const setSkyRef = useRef<((values: Record<string, unknown>) => void) | null>(
    null
  )

  const syncSlidersFromDebug = () => {
    const d = skyDebug.current
    setSkyRef.current?.({
      overrideSun: d.overrideSun,
      elevation: d.elevation,
      azimuth: d.azimuth,
      overrideWeather: d.overrideWeather,
      cloudCover: d.cloudCover,
      rainFactor: d.rainFactor,
      windSpeed: d.windSpeed
    })
  }

  const [, setSky] = useControls("sky", () => ({
    timePreset: {
      value: "live" as string,
      options: ["live", ...Object.keys(SKY_TIME_PRESETS)],
      onChange: (
        value: string,
        _path: string,
        context: { initial: boolean }
      ) => {
        if (context.initial) return
        applyTimePreset(value as SkyTimePreset)
        syncSlidersFromDebug()
      }
    },
    weatherPreset: {
      value: "live" as string,
      options: ["live", ...Object.keys(SKY_WEATHER_PRESETS)],
      onChange: (
        value: string,
        _path: string,
        context: { initial: boolean }
      ) => {
        if (context.initial) return
        applyWeatherPreset(value as SkyWeatherPreset)
        syncSlidersFromDebug()
      }
    },
    overrideSun: {
      value: skyDebug.current.overrideSun,
      onChange: (value: boolean) => {
        skyDebug.current.overrideSun = value
      }
    },
    elevation: {
      value: skyDebug.current.elevation,
      min: -90,
      max: 90,
      step: 0.5,
      onChange: (value: number) => {
        skyDebug.current.elevation = value
      }
    },
    azimuth: {
      value: skyDebug.current.azimuth,
      min: 0,
      max: 360,
      step: 1,
      onChange: (value: number) => {
        skyDebug.current.azimuth = value
      }
    },
    timeScale: {
      value: skyDebug.current.timeScale,
      min: 1,
      max: 5000,
      step: 1,
      onChange: (value: number) => {
        skyDebug.current.timeScale = value
      }
    },
    yawOffset: {
      value: skyDebug.current.yawOffset,
      min: -180,
      max: 180,
      step: 1,
      onChange: (value: number) => {
        skyDebug.current.yawOffset = value
      }
    },
    overrideWeather: {
      value: skyDebug.current.overrideWeather,
      onChange: (value: boolean) => {
        skyDebug.current.overrideWeather = value
      }
    },
    cloudCover: {
      value: skyDebug.current.cloudCover,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (value: number) => {
        skyDebug.current.cloudCover = value
      }
    },
    rainFactor: {
      value: skyDebug.current.rainFactor,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (value: number) => {
        skyDebug.current.rainFactor = value
      }
    },
    windSpeed: {
      value: skyDebug.current.windSpeed,
      min: 0,
      max: 120,
      step: 1,
      onChange: (value: number) => {
        skyDebug.current.windSpeed = value
      }
    },
    sunIntensity: {
      value: skyDebug.current.sunIntensity,
      min: 0,
      max: 60,
      step: 0.5,
      onChange: (value: number) => {
        skyDebug.current.sunIntensity = value
      }
    },
    sunDiscIntensity: {
      value: skyDebug.current.sunDiscIntensity,
      min: 0,
      max: 200,
      step: 1,
      onChange: (value: number) => {
        skyDebug.current.sunDiscIntensity = value
      }
    }
  }))

  useEffect(() => {
    setSkyRef.current = setSky
  }, [setSky])

  return null
}

const PostprocessingDebugControls = () => {
  const [, setBasics] = useControls("Basics", () => ({
    contrast: {
      value: postprocessingDebug.basics.current.contrast,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: onNumberChange((value) => {
        postprocessingDebug.basics.current.contrast = value
      })
    },
    brightness: {
      value: postprocessingDebug.basics.current.brightness,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: onNumberChange((value) => {
        postprocessingDebug.basics.current.brightness = value
      })
    },
    exposure: {
      value: postprocessingDebug.basics.current.exposure,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: onNumberChange((value) => {
        postprocessingDebug.basics.current.exposure = value
      })
    },
    gamma: {
      value: postprocessingDebug.basics.current.gamma,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: onNumberChange((value) => {
        postprocessingDebug.basics.current.gamma = value
      })
    }
  }))

  const [, setBloom] = useControls("Bloom", () => ({
    strength: {
      value: postprocessingDebug.bloom.current.strength,
      min: 0,
      max: 10,
      step: 0.01,
      onChange: onNumberChange((value) => {
        postprocessingDebug.bloom.current.strength = value
      })
    },
    radius: {
      value: postprocessingDebug.bloom.current.radius,
      min: 0,
      max: 10,
      step: 0.01,
      onChange: onNumberChange((value) => {
        postprocessingDebug.bloom.current.radius = value
      })
    },
    threshold: {
      value: postprocessingDebug.bloom.current.threshold,
      min: 0,
      max: 10,
      step: 0.01,
      onChange: onNumberChange((value) => {
        postprocessingDebug.bloom.current.threshold = value
      })
    }
  }))

  const [, setVignette] = useControls("Vignette", () => ({
    radius: {
      value: postprocessingDebug.vignette.current.radius,
      min: 0,
      max: 5,
      step: 0.01,
      onChange: onNumberChange((value) => {
        postprocessingDebug.vignette.current.radius = value
      })
    },
    spread: {
      value: postprocessingDebug.vignette.current.spread,
      min: 0,
      max: 5,
      step: 0.01,
      onChange: onNumberChange((value) => {
        postprocessingDebug.vignette.current.spread = value
      })
    }
  }))

  useEffect(() => {
    registerLevaSetters({ setBasics, setBloom, setVignette })
    return () => {
      registerLevaSetters(null)
      postprocessingDebug.hasChanged.current = false
    }
  }, [setBasics, setBloom, setVignette])

  return null
}

// Dynamically imported from ./index only when ?debug is present.
export const OnlyDebug = () => (
  <>
    <Leva collapsed fill />
    <CameraDebugControls />
    <SkyDebugControls />
    <PostprocessingDebugControls />
    <ReactScan />
  </>
)
