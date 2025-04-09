import { useThree } from "@react-three/fiber"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ThreePerf } from "three-perf"

import { getPerf, setPerf } from "@/hooks/use-perf"

export const PerfMonitor = () => {
  const searchParams = useSearchParams()
  const [debug, setDebug] = useState(false)
  const perfRef = useRef<ThreePerf | undefined>(undefined)
  const gl = useThree((s) => s.gl)
  const { instance } = getPerf()

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
      logsPerSecond: 1
    })
    perfRef.current.ui.wrapper.style.top = "37px"
    perfRef.current.ui.wrapper.style.display = "none"
    setPerf({ instance: perfRef.current })
  }, [gl, instance])

  useEffect(() => {
    if (!perfRef.current) return
    const perfInstance = perfRef.current

    if (debug) {
      perfInstance.enabled = true
      perfRef.current.ui.wrapper.style.display = "block"
      perfInstance.logsPerSecond = 10
    }

    return () => {
      perfInstance.enabled = false
    }
  }, [debug])

  return null
}
