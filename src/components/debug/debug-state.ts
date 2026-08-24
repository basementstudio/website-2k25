import { create } from "zustand"

export const useDebugCameraStore = create<{
  flyMode: boolean
  setFlyMode: (flyMode: boolean) => void
}>((set) => ({
  flyMode: false,
  setFlyMode: (flyMode) => set({ flyMode })
}))

export interface PostprocessingBasics {
  contrast: number
  brightness: number
  exposure: number
  gamma: number
}

export interface PostprocessingBloom {
  strength: number
  radius: number
  threshold: number
}

export interface PostprocessingVignette {
  radius: number
  spread: number
}

export const postprocessingDebug = {
  hasChanged: { current: false },
  basics: {
    current: {
      contrast: 1,
      brightness: 1,
      exposure: 1,
      gamma: 1
    } satisfies PostprocessingBasics
  },
  bloom: {
    current: {
      strength: 1,
      radius: 1,
      threshold: 1
    } satisfies PostprocessingBloom
  },
  vignette: {
    current: {
      radius: 1,
      spread: 1
    } satisfies PostprocessingVignette
  }
}

interface LevaSetters {
  setBasics: (value: PostprocessingBasics) => void
  setBloom: (value: PostprocessingBloom) => void
  setVignette: (value: PostprocessingVignette) => void
}

let levaSetters: Partial<LevaSetters> = {}

export const registerLevaSetters = (setters: Partial<LevaSetters> | null) => {
  levaSetters = setters ?? {}
}

export const syncPostprocessingLeva = {
  setBasics: (value: PostprocessingBasics) => {
    Object.assign(postprocessingDebug.basics.current, value)
    levaSetters.setBasics?.(value)
  },
  setBloom: (value: PostprocessingBloom) => {
    Object.assign(postprocessingDebug.bloom.current, value)
    levaSetters.setBloom?.(value)
  },
  setVignette: (value: PostprocessingVignette) => {
    Object.assign(postprocessingDebug.vignette.current, value)
    levaSetters.setVignette?.(value)
  }
}
