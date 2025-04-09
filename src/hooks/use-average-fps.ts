import { useAnimationFrame } from "motion/react"
import { useRef, useState } from "react"

const TWO_MINUTES_MS = 120 * 1000

const useAverageFPS = () => {
  const [currentFPS, setCurrentFPS] = useState<number>(0)
  const fpsHistoryRef = useRef<Array<{ timestamp: number; fps: number }>>([])
  const lastFrameTimeRef = useRef<number>(performance.now())

  const calculateFPS = () => {
    const now = performance.now()

    const delta = now - lastFrameTimeRef.current
    lastFrameTimeRef.current = now

    const fps = 1000 / delta
    setCurrentFPS(Math.round(fps))

    fpsHistoryRef.current.push({ timestamp: now, fps })

    const cutoffTime = now - TWO_MINUTES_MS
    while (
      fpsHistoryRef.current.length &&
      fpsHistoryRef.current[0].timestamp < cutoffTime
    ) {
      fpsHistoryRef.current.shift()
    }
  }

  useAnimationFrame(() => {
    calculateFPS()
  })

  // Calculate the average FPS from the history
  const averageFPS =
    fpsHistoryRef.current.length === 0
      ? 0
      : Math.round(
          fpsHistoryRef.current.reduce((sum, sample) => sum + sample.fps, 0) /
            fpsHistoryRef.current.length
        )

  return {
    currentFPS,
    averageFPS
  }
}

export default useAverageFPS
