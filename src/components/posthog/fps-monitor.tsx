"use client"

import posthog from "posthog-js"
import { memo, useEffect, useRef, useState } from "react"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import useDebounceValue from "@/hooks/use-debounce-value"
import useFPSMonitor from "@/hooks/use-fps-monitor"

const SAMPLE_DURATION = 20000
const FPS_THRESHOLD = 40

const FPSMonitor = memo(() => {
  const [sampleTaken, setSampleTaken] = useState(false)
  const { currentFPS, averageFPS, timestamp } = useFPSMonitor({
    enabled: !sampleTaken
  })
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)
  const fpsHistory = useRef<{
    [key: string]: { fps: number; scrollY: number }
  }>({})
  const [hasDroppedFPS, setHasDroppedFPS] = useState(false)
  const debouncedCurrentFPS = useDebounceValue(currentFPS, 30)

  useEffect(() => {
    if (hasDroppedFPS || !canRunMainApp) return
    if (averageFPS < FPS_THRESHOLD) {
      setHasDroppedFPS(true)
    }
  }, [averageFPS, canRunMainApp, hasDroppedFPS])

  useEffect(() => {
    if (!hasDroppedFPS || sampleTaken || !canRunMainApp) return

    console.log("sampling started")
    if (debouncedCurrentFPS > 0) {
      fpsHistory.current[(timestamp / 1000).toFixed(2)] = {
        fps: debouncedCurrentFPS,
        scrollY: window.scrollY
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDroppedFPS, sampleTaken, canRunMainApp, debouncedCurrentFPS])

  useEffect(() => {
    if (!hasDroppedFPS || !canRunMainApp) return
    setTimeout(() => {
      setSampleTaken(true)
      posthog.capture("User FPS Drop", { sample: fpsHistory.current })
      console.log("sample sent")
    }, SAMPLE_DURATION)
  }, [canRunMainApp, hasDroppedFPS])

  return null
})

FPSMonitor.displayName = "FPSMonitor"

export default FPSMonitor
