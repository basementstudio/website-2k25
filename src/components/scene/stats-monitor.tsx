import { useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import Stats from "three/examples/jsm/libs/stats.module.js"

export const StatsMonitor = () => {
  const statsRef = useRef<Stats | null>(null)

  useEffect(() => {
    const stats = new Stats()
    stats.dom.style.cssText =
      "position:fixed;top:0;left:0;z-index:10000;cursor:pointer;opacity:0.9;"
    document.body.appendChild(stats.dom)
    statsRef.current = stats

    return () => {
      document.body.removeChild(stats.dom)
      statsRef.current = null
    }
  }, [])

  useFrame(() => {
    statsRef.current?.update()
  })

  return null
}
