import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"

import { useStateToRef } from "@/hooks/use-state-to-ref"

import { useAssets } from "../assets-provider"
import { useNavigationStore } from "../navigation-handler/navigation-store"

// Fallback component for when the worker fails or isn't supported
const Fallback = dynamic(
  () => import("./fallback-loading").then((mod) => mod.FallbackLoading),
  { ssr: false }
)

interface LoadingCanvasProps {
  isVisible: boolean
  onFinishLoading?: () => void
  progress?: number
}

function LoadingCanvas({
  isVisible,
  onFinishLoading,
  progress = 0
}: LoadingCanvasProps) {
  const [worker, setWorker] = useState<Worker | null>(null)
  const workerRef = useRef<Worker | null>(null)
  workerRef.current = worker
  const progressRef = useStateToRef(progress)
  const isVisibleRef = useStateToRef(isVisible)

  const { officeWireframe } = useAssets()

  const currentScene = useNavigationStore((state) => state.currentScene)

  const loadedRef = useRef(false)

  useEffect(() => {
    if (!worker || !currentScene || loadedRef.current) return
    console.log(worker, currentScene, loadedRef.current)

    // Initialize the loading scene
    worker.postMessage({
      type: "update-camera-config",
      cameraConfig: currentScene.cameraConfig
    })

    // loadedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worker, currentScene])

  useEffect(() => {
    // Create a new worker for the loading screen
    const newWorker = new Worker(
      new URL("@/workers/loading-worker.tsx", import.meta.url),
      {
        type: "module"
      }
    )

    setWorker(newWorker)

    newWorker.postMessage({
      type: "initialize",
      modelUrl: officeWireframe
    })

    const handleError = (error: ErrorEvent) => {
      console.error("[LoadingCanvas] Worker error:", error)
    }

    newWorker.addEventListener("error", handleError)

    return () => {
      console.log("TERMINATED WORKER")
    }
  }, [])

  // Update the loading progress
  useEffect(() => {
    if (worker && progressRef.current !== undefined) {
      worker.postMessage({
        type: "update-progress",
        progress: progressRef.current
      })
    }
  }, [worker, progressRef, progress])

  // Update the app loaded state
  useEffect(() => {
    if (worker) {
      worker.postMessage({
        type: "update-loading-status",
        isAppLoaded: !isVisibleRef.current
      })

      // If the loading screen is not visible anymore, trigger the onFinishLoading callback
      if (!isVisibleRef.current && onFinishLoading) {
        // Small delay to allow for transitions
        const timeout = setTimeout(() => {
          onFinishLoading()
        }, 1000)

        return () => clearTimeout(timeout)
      }
    }

    return undefined
  }, [worker, isVisibleRef, isVisible, onFinishLoading])

  if (!worker) {
    return <Fallback />
  }

  return (
    <div
      className={`fixed inset-0 z-[200] transition-opacity duration-1000 ${
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <OffscreenCanvas
        worker={worker}
        fallback={<Fallback />}
        frameloop="always"
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
      />
    </div>
  )
}

export default LoadingCanvas
