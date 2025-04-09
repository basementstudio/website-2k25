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
    perfRef.current = new ThreePerf({
      anchorX: "right",
      anchorY: "bottom",
      domElement: document.body, // or other canvas rendering wrapper
      renderer: gl // three js renderer instance you use for rendering
    })
    setPerf({ instance: perfRef.current })
  }, [gl, instance])

  useEffect(() => {
    if (!perfRef.current) return
    console.log(debug)
    perfRef.current.visible = debug
  }, [debug])

  return null
}
