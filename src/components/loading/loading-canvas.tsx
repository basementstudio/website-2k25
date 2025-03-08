import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import dynamic from "next/dynamic"
import { useEffect, useRef } from "react"

import { useAssets } from "../assets-provider"
import { useNavigationStore } from "../navigation-handler/navigation-store"

// Fallback component for when the worker fails or isn't supported
const Fallback = dynamic(
  () => import("./fallback-loading").then((mod) => mod.FallbackLoading),
  { ssr: false }
)

interface LoadingCanvasProps {
  loadingCanvasWorker: Worker
}

function LoadingCanvas({ loadingCanvasWorker }: LoadingCanvasProps) {
  const { officeWireframe } = useAssets()

  const currentScene = useNavigationStore((state) => state.currentScene)

  const loadedRef = useRef(false)

  useEffect(() => {
    if (!currentScene || loadedRef.current) return

    // Initialize the loading scene
    loadingCanvasWorker.postMessage({
      type: "update-camera-config",
      cameraConfig: currentScene.cameraConfig
    })

    // loadedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingCanvasWorker, currentScene])

  useEffect(() => {
    // start the loading scene
    loadingCanvasWorker.postMessage({
      type: "initialize",
      modelUrl: officeWireframe
    })

    const handleError = (error: ErrorEvent) => {
      console.error("[LoadingCanvas] Worker error:", error)
    }

    loadingCanvasWorker.addEventListener("error", handleError)

    return () => {
      loadingCanvasWorker.terminate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingCanvasWorker])

  return (
    <div className="fixed inset-0 z-[200]">
      <OffscreenCanvas
        worker={loadingCanvasWorker}
        fallback={<Fallback />}
        frameloop="always"
        camera={{ position: [0, 0, 100] }}
        gl={{ antialias: true, alpha: true }}
      />
    </div>
  )
}

export default LoadingCanvas
