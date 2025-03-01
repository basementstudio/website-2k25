import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

import { useStateToRef } from "@/hooks/use-state-to-ref"
import { useAssets } from "../assets-provider"
import { updateCameraSubscribable } from "./app-loading-handler"

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

  const { routingElements } = useAssets()

  useEffect(() => {
    // Create a new worker for the loading screen
    const newWorker = new Worker(
      new URL("@/workers/loading-worker.tsx", import.meta.url),
      {
        type: "module"
      }
    )

    setWorker(newWorker)

    // Initialize the loading scene
    newWorker.postMessage({
      type: "initialize",
      modelUrl: routingElements
    })

    const handleError = (error: ErrorEvent) => {
      console.error("[LoadingCanvas] Worker error:", error)
    }

    newWorker.addEventListener("error", handleError)

    newWorker.postMessage({
      type: "update-camera",
      cameraPosition: {
        x: 0,
        y: 0,
        z: 5
      },
      cameraTarget: {
        x: 0,
        y: 0,
        z: 0
      },
      cameraFov: 75
    })

    const cId = updateCameraSubscribable.addCallback(
      (cameraPosition, cameraTarget, cameraFov) => {
        newWorker.postMessage({
          type: "update-camera",
          cameraPosition: {
            x: cameraPosition.x,
            y: cameraPosition.y,
            z: cameraPosition.z
          },
          cameraTarget: {
            x: cameraTarget.x,
            y: cameraTarget.y,
            z: cameraTarget.z
          },
          cameraFov
        })
      }
    )

    return () => {
      console.log("TERMINATED WORKER")

      // newWorker.terminate()
      // updateCameraSubscribable.removeCallback(cId)
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
