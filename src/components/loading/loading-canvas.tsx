import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import dynamic from "next/dynamic"
import { useEffect, useRef } from "react"

import { useMedia } from "@/hooks/use-media"
import { cn } from "@/utils/cn"

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
  const isBasketball = currentScene?.name === "basketball"

  const isDesktop = useMedia("max-width: 1024px")

  const loadedRef = useRef(false)

  useEffect(() => {
    if (!currentScene || loadedRef.current || !loadingCanvasWorker) return

    // Initialize the loading scene
    loadingCanvasWorker.postMessage({
      type: "update-camera-config",
      cameraConfig: currentScene.cameraConfig
    })
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
        "absolute left-0 top-0 z-[200] h-[80svh] w-full lg:fixed lg:aspect-auto lg:h-[100svh]",
        isBasketball && !isDesktop && "inset-x-0 top-0 h-[100svh]",
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
