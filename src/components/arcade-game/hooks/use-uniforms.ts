import { useCallback, useMemo, useRef } from "react"
import { ShaderMaterial } from "three"

import { useStateToRef } from "./use-state-to-ref"

export interface Uniform<T = unknown> {
  value: T
}

export type Uniforms<T = Record<string, unknown>> = {
  [K in keyof T]: Uniform<T[K]>
}

interface UseUnifomsOptions<Uniforms> {
  onUpdate?: (updatedUniforms: Partial<Uniforms>) => void
  syncShader?: ShaderMaterial
}

export const useUniforms = <T extends Record<string, unknown>>(
  state: T | (() => T),
  options: UseUnifomsOptions<T> = {}
) => {
  // memorize uniforms object
  const uniformsObject = useMemo(() => {
    const u: Partial<Uniforms<T>> = {}
    const initialState = typeof state === "function" ? state() : state
    Object.entries(initialState).forEach(([key, value]) => {
      ;(u as any)[key] = { value }
    })
    return u as Uniforms<T>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // create ref
  const uniformsRef = useRef(uniformsObject)

  const onUpdateRef = useStateToRef(options.onUpdate)
  const syncShaderRef = useStateToRef(options.syncShader)

  const updateUniforms = useCallback(
    (state: Partial<T>) => {
      Object.entries(state).forEach(([key, value]) => {
        ;(uniformsRef.current as any)[key].value = value

        if (syncShaderRef.current) {
          syncShaderRef.current.uniforms[key].value = value
        }
      })
      if (onUpdateRef.current) onUpdateRef.current(state)
    },
    [onUpdateRef, syncShaderRef]
  )

  return [uniformsRef.current, updateUniforms] as const
}
