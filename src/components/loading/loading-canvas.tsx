import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import dynamic from "next/dynamic"
import { useEffect, useRef } from "react"

import { useAssets } from "../assets-provider"
import { useNavigationStore } from "../navigation-handler/navigation-store"
import { useAppLoadingStore } from "./app-loading-handler"

// Fallback component for when the worker fails or isn't supported
const Fallback = dynamic(
  () => import("./fallback-loading").then((mod) => mod.FallbackLoading),
  { ssr: false }
)

function LoadingCanvas() {
  const loadingCanvasWorker = useAppLoadingStore((state) => state.worker)

  const { officeWireframe } = useAssets()

  const currentScene = useNavigationStore((state) => state.currentScene)

  const loadedRef = useRef(false)

  useEffect(() => {
    if (!currentScene || loadedRef.current || !loadingCanvasWorker) return

    // Initialize the loading scene
    loadingCanvasWorker.postMessage({
      type: "update-camera-config",
      cameraConfig: currentScene.cameraConfig
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingCanvasWorker, currentScene])

  useEffect(() => {
    const worker = new Worker(
      new URL("@/workers/loading-worker.tsx", import.meta.url),
      {
        type: "module"
      }
    )

    useAppLoadingStore.setState({ worker })

    // start the loading scene
    worker.postMessage({
      type: "initialize",
      modelUrl: officeWireframe
    })

    const handleError = (error: ErrorEvent) => {
      console.error("[LoadingCanvas] Worker error:", error)
    }

    worker.addEventListener("error", handleError)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!loadingCanvasWorker) return null

  return (
    <div className="fixed inset-0 z-[200]">
      <OffscreenCanvas
        worker={loadingCanvasWorker}
        fallback={null}
        frameloop="always"
        camera={{ position: [0, 0, 100], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      />
    </div>
  )
}

export default LoadingCanvas
