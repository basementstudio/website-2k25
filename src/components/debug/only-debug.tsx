"use client"

import { Leva, useControls } from "leva"
import { useEffect } from "react"

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
    <PostprocessingDebugControls />
    <ReactScan />
  </>
)
