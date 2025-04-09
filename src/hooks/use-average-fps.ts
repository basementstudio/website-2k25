import { useAnimationFrame } from "motion/react"
import { useEffect, useRef, useState } from "react"

const FILTER_STRENGTH = 20

const useAverageFPS = () => {
  const [fps, setFPS] = useState<number>(0)
  const [fpsHistory, setFPSHistory] = useState<number[]>([])
  const frameTimeRef = useRef<number>(0)
  const lastLoopRef = useRef<Date>(new Date())
  const thisLoopRef = useRef<Date>(new Date())

  // Calculate FPS using a low-pass filter
  const calculateFPS = () => {
    thisLoopRef.current = new Date()
    const thisFrameTime =
      thisLoopRef.current.getTime() - lastLoopRef.current.getTime()
    frameTimeRef.current +=
      (thisFrameTime - frameTimeRef.current) / FILTER_STRENGTH
    lastLoopRef.current = thisLoopRef.current

    const currentFPS = 1000 / frameTimeRef.current
    setFPS(Math.round(currentFPS))
    return currentFPS
  }

  useAnimationFrame(() => {
    calculateFPS()
  })

  useEffect(() => {
    // Update FPS history every second
    const historyInterval = setInterval(() => {
      setFPSHistory((prev) => {
        const newHistory = [...prev, fps]
        // Keep only last 10 readings
        return newHistory.slice(-10)
      })
    }, 1000)

    return () => {
      clearInterval(historyInterval)
    }
  }, [fps])

  return {
    currentFPS: fps,
    fpsHistory
  }
}

export default useAverageFPS
