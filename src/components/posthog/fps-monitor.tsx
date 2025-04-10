"use client"

import { usePathname } from "next/navigation"
import posthog from "posthog-js"
import { memo, useEffect, useRef, useState } from "react"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import useDebounceValue from "@/hooks/use-debounce-value"
import useFPSMonitor from "@/hooks/use-fps-monitor"

const SAMPLE_DURATION = 20000
const FPS_THRESHOLD = 40

type FPSSample = {
  fps: number
  scrollY: number
  pathname: string
}

const FPSMonitor = memo(() => {
  const pathname = usePathname()
  const [stopMonitoring, setStopMonitoring] = useState(false)
  const { currentFPS, averageFPS, timestamp } = useFPSMonitor({
    enabled: !stopMonitoring
  })
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)
  const fpsHistory = useRef<{
    [key: string]: FPSSample
  }>({})
  const [hasDroppedFPS, setHasDroppedFPS] = useState(false)
  const debouncedCurrentFPS = useDebounceValue(currentFPS, 30)

  useEffect(() => {
    // If the user has already dropped FPS, or the app is not ready, don't sample
    if (hasDroppedFPS || !canRunMainApp) return

    // If the average FPS is below the threshold, set the state to true
    if (averageFPS < FPS_THRESHOLD) {
      setHasDroppedFPS(true)
    }
  }, [averageFPS, canRunMainApp, hasDroppedFPS])

  useEffect(() => {
    if (!hasDroppedFPS || stopMonitoring || !canRunMainApp) return

    console.log("sampling started")
    // If the current FPS is above 0, add the sample to the history
    if (debouncedCurrentFPS > 0) {
      fpsHistory.current[(timestamp / 1000).toFixed(2)] = {
        fps: debouncedCurrentFPS,
        scrollY: window.scrollY,
        pathname
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDroppedFPS, stopMonitoring, canRunMainApp, debouncedCurrentFPS])

  useEffect(() => {
    if (!hasDroppedFPS || !canRunMainApp || stopMonitoring) return
    const timeout = setTimeout(() => {
      setStopMonitoring(true)

      // order fpsHistory by timestamp
      const orderedFPSHistory = Object.keys(fpsHistory.current)
        .sort()
        .reduce((obj: Record<string, FPSSample>, key) => {
          obj[key] = fpsHistory.current[key]
          return obj
        }, {})

      // send the sample to posthog
      posthog.capture("User FPS Drop", { sample: orderedFPSHistory })
      console.log("sample sent")
    }, SAMPLE_DURATION)

    return () => clearTimeout(timeout)
  }, [canRunMainApp, hasDroppedFPS, stopMonitoring])

  return null
})

FPSMonitor.displayName = "FPSMonitor"

export default FPSMonitor
