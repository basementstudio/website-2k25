import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import dynamic from "next/dynamic"
import { useEffect, useRef } from "react"
import { Vector3 } from "three"

import { useAssets } from "@/components/assets-provider/use-assets"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { cn } from "@/utils/cn"

import { useNavigationStore } from "../navigation-handler/navigation-store"
import { useAppLoadingStore } from "./app-loading-handler"

// Fallback component for when the worker fails or isn't supported
const Fallback = dynamic(
  () => import("./fallback-loading").then((mod) => mod.FallbackLoading),
  { ssr: false }
)

function LoadingCanvas({ hide }: { hide: boolean }) {
  const loadingCanvasWorker = useAppLoadingStore((state) => state.worker)

  const assets = useAssets()

  const currentScene = useNavigationStore((state) => state.currentScene)

  const loadedRef = useRef(false)

  useEffect(() => {
    if (!currentScene || loadedRef.current || !loadingCanvasWorker) return

    // Initialize the loading scene
    loadingCanvasWorker.postMessage({
      type: "update-camera-config",
      actualCamera: {
        position: new Vector3(
          currentScene.cameraConfig.position[0],
          currentScene.cameraConfig.position[1],
          currentScene.cameraConfig.position[2]
        ),
        target: new Vector3(
          currentScene.cameraConfig.target[0],
          currentScene.cameraConfig.target[1],
          currentScene.cameraConfig.target[2]
        ),
        fov: currentScene.cameraConfig.fov
      }
    })
  }, [loadingCanvasWorker, currentScene])

  const scene = useCurrentScene()

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
      modelUrl: assets?.officeWireframe ?? ""
    })

    worker.addEventListener("message", (e: MessageEvent<{ type: string }>) => {
      const { type } = e.data

      if (type === "loading-transition-complete") {
        useAppLoadingStore.setState({ showLoadingCanvas: false })
      }

      if (type === "offscreen-canvas-loaded") {
        useAppLoadingStore.setState({ offscreenCanvasReady: true })
      }
    })

    const handleError = (error: ErrorEvent) => {
      console.error("[LoadingCanvas] Worker error:", error)
    }

    worker.addEventListener("error", handleError)

    return () => {
      worker.terminate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)

  if (!loadingCanvasWorker) return null

  return (
    <div
      className={cn(
        "absolute inset-0",
        (scene === "basketball" || scene === "lab" || scene === "404") &&
          "inset-x-0 top-0 h-[100svh]",
        hide && "hidden",
        !canRunMainApp && "bg-black"
      )}
    >
      <OffscreenCanvas
        worker={loadingCanvasWorker}
        fallback={<Fallback />}
        frameloop="always"
        gl={{ antialias: true, alpha: true }}
      />
    </div>
  )
}

export default LoadingCanvas
