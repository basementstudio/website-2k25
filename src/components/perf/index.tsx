import { useThree } from "@react-three/fiber"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ThreePerf } from "three-perf"

import { useFrameCallback } from "@/hooks/use-pausable-time"

export const PerfMonitor = () => {
  const searchParams = useSearchParams()
  const [debug, setDebug] = useState(false)
  const perfRef = useRef<ThreePerf | undefined>(undefined)
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    const hasDebg = searchParams.has("debug")
    if (!hasDebg) return
    setDebug(hasDebg)
  }, [searchParams])

  useEffect(() => {
    perfRef.current = new ThreePerf({
      anchorX: "right",
      anchorY: "bottom",
      domElement: document.body, // or other canvas rendering wrapper
      renderer: gl // three js renderer instance you use for rendering
    })
  }, [gl])

  useEffect(() => {
    if (!perfRef.current) return
    console.log(debug)
    perfRef.current.visible = debug
  }, [debug])

  useFrameCallback(() => {
    if (!perfRef.current) return

    perfRef.current.begin()
    gl.render(scene, camera)
    perfRef.current.end()
  })

  return null
}
