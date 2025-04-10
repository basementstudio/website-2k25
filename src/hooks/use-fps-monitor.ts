import { useAnimationFrame } from "motion/react"
import { useRef, useState } from "react"

type UseFPSMonitorOptions = {
  /** Smoothing factor for the fast EMA (more sensitive to changes) */
  fastAlpha?: number
  /** Smoothing factor for the slow EMA (more stable) */
  slowAlpha?: number
  /** If the difference between fast and slow exceeds this threshold, the fast average is used */
  instabilityThreshold?: number
  /** Whether to enable the FPS monitor */
  enabled?: boolean
}

type FPSMonitorResult = {
  currentFPS: number
  averageFPS: number
  timestamp: number
}

const useFPSMonitor = ({
  fastAlpha = 0.2,
  slowAlpha = 0.05,
  instabilityThreshold = 5, // fps difference threshold
  enabled = true
}: UseFPSMonitorOptions = {}): FPSMonitorResult => {
  const [currentFPS, setCurrentFPS] = useState<number>(0)
  const [averageFPS, setAverageFPS] = useState<number>(0)

  // For high-resolution timing
  const lastFrameTimeRef = useRef<number>(performance.now())
  // Fast and slow exponential moving averages
  const fastEMARef = useRef<number>(0)
  const slowEMARef = useRef<number>(0)
  // A flag to initialize EMAs on the first frame
  const initializedRef = useRef<boolean>(false)

  useAnimationFrame(() => {
    if (!enabled) return

    const now = performance.now()
    const delta = now - lastFrameTimeRef.current
    lastFrameTimeRef.current = now

    // Calculate instantaneous FPS
    const fps = 1000 / delta
    setCurrentFPS(Math.round(fps))

    // Initialize the EMAs on the first frame to avoid a jump from zero
    if (!initializedRef.current) {
      fastEMARef.current = fps
      slowEMARef.current = fps
      initializedRef.current = true
    } else {
      // Update the EMAs
      fastEMARef.current =
        fastAlpha * fps + (1 - fastAlpha) * fastEMARef.current
      slowEMARef.current =
        slowAlpha * fps + (1 - slowAlpha) * slowEMARef.current
    }

    // Compute the difference between fast and slow averages
    const diff = Math.abs(fastEMARef.current - slowEMARef.current)
    // If the difference exceeds the instability threshold,
    // use the fastEMA (more reactive) as the average.
    // Otherwise, use the smoother slowEMA.
    const effectiveAverage =
      diff > instabilityThreshold ? fastEMARef.current : slowEMARef.current
    setAverageFPS(Math.round(effectiveAverage))
  })

  return {
    currentFPS,
    averageFPS,
    timestamp: lastFrameTimeRef.current
  }
}

export default useFPSMonitor
