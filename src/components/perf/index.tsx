"use client"

import { useThree } from "@react-three/fiber"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { ThreePerf } from "three-perf"

import { useFrameCallback } from "@/hooks/use-pausable-time"
import { setPerf, usePerf } from "@/hooks/use-perf"
import { debounce } from "@/utils/debounce"

const DEBOUNCE_WAIT = 5

export const PerfMonitor = () => {
  const searchParams = useSearchParams()
  const [debug, setDebug] = useState(false)
  const perfRef = useRef<ThreePerf | undefined>(undefined)
  const gl = useThree((s) => s.gl)
  const instance = usePerf((s) => s.instance)

  const debouncedUpdatePerfStore = useMemo(
    () => debounce(setPerf, DEBOUNCE_WAIT),
    []
  )

  useEffect(() => {
    const hasDebg = searchParams.has("debug")
    if (!hasDebg) return
    setDebug(hasDebg)
  }, [searchParams])

  useEffect(() => {
    if (instance) return

    const canvasContainer = document.getElementById("canvas")
    perfRef.current = new ThreePerf({
      anchorX: "right",
      anchorY: "top",
      domElement: canvasContainer || document.body, // or other canvas rendering wrapper
      renderer: gl, // three js renderer instance you use for rendering
      enabled: false,
      overClock: false
    })
    perfRef.current.ui.wrapper.style.top = "37px"
    perfRef.current.ui.wrapper.style.display = "none"
    setPerf({ instance: perfRef.current })
  }, [gl, instance])

  useEffect(() => {
    if (!perfRef.current) return
    const perfInstance = perfRef.current

    if (debug) {
      perfRef.current.ui.wrapper.style.display = "block"
      perfInstance.enabled = true
      setPerf({ instance: perfInstance })
    }

    return () => {
      perfInstance.enabled = false
    }
  }, [debug])

  useFrameCallback(() => {
    if (!perfRef.current) return
    const perfInstance = perfRef.current
    if (!perfInstance.enabled) return

    debouncedUpdatePerfStore(
      (state) => ({
        ...state,
        log: perfInstance.log,
        infos: perfInstance.infos,
        startTime: perfInstance.startTime,
        fpsLimit: perfInstance.fpsLimit,
        overclockingFps: perfInstance.overclockingFps,
        accumulated: perfInstance.accumulated,
        chart: perfInstance.chart,
        gl: perfInstance.gl,
        objectWithMaterials: perfInstance.objectWithMaterials,
        programs: perfInstance.programs
      }),
      true
    )
  })

  return null
}
