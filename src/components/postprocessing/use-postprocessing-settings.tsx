import { useControls } from "leva"
import { useRef } from "react"

interface Basics {
  contrast: number
  brightness: number
  exposure: number
  gamma: number
}

interface Bloom {
  strength: number
  radius: number
  threshold: number
}

interface Vignette {
  radius: number
  spread: number
}

export const usePostprocessingSettings = () => {
  const hasChanged = useRef(false)

  const basics = useRef<Basics>({
    contrast: 1,
    brightness: 1,
    exposure: 1,
    gamma: 1
  })

  const bloom = useRef<Bloom>({
    strength: 1,
    radius: 1,
    threshold: 1
  })

  const vignette = useRef<Vignette>({
    radius: 1,
    spread: 1
  })

  const [_, setBasics] = useControls("Basics", () => ({
    contrast: {
      value: 1,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (v) => {
        basics.current.contrast = v
        hasChanged.current = true
      }
    },
    brightness: {
      value: 1,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (v) => {
        basics.current.brightness = v
        hasChanged.current = true
      }
    },
    exposure: {
      value: 1,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (v) => {
        basics.current.exposure = v
        hasChanged.current = true
      }
    },
    gamma: {
      value: 1,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (v) => {
        basics.current.gamma = v
        hasChanged.current = true
      }
    }
  }))

  const [__, setBloom] = useControls("Bloom", () => ({
    strength: {
      value: 1,
      min: 0,
      max: 10,
      step: 0.01,
      onChange: (v) => {
        bloom.current.strength = v
        hasChanged.current = true
      }
    },
    radius: {
      value: 1,
      min: 0,
      max: 10,
      step: 0.01,
      onChange: (v) => {
        bloom.current.radius = v
        hasChanged.current = true
      }
    },
    threshold: {
      value: 1,
      min: 0,
      max: 10,
      step: 0.01,
      onChange: (v) => {
        bloom.current.threshold = v
        hasChanged.current = true
      }
    }
  }))

  const [___, setVignette] = useControls("Vignette", () => ({
    radius: {
      value: 1,
      min: 0,
      max: 10,
      step: 0.01,
      onChange: (v) => {
        vignette.current.radius = v
        hasChanged.current = true
      }
    },
    spread: {
      value: 1,
      min: 0,
      max: 10,
      step: 0.01,
      onChange: (v) => {
        vignette.current.spread = v
        hasChanged.current = true
      }
    }
  }))

  return {
    basics: basics.current,
    bloom: bloom.current,
    vignette: vignette.current,
    setBasics,
    setBloom,
    setVignette,
    hasChanged
  }
}
