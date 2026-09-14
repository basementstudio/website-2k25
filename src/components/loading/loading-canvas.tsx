import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import * as Sentry from "@sentry/nextjs"
import { useEffect, useState } from "react"
import { Vector3 } from "three"

import { useAssets } from "@/components/assets-provider"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { workerErrorFromMessage, workerErrorReport } from "@/lib/worker-error"
import { cn } from "@/utils/cn"

import { useAppLoadingStore } from "./app-loading-handler"

// Keep the original WebGL loader isolated from the main scene's renderer.
export default function LoadingCanvas() {
  const show = useAppLoadingStore((s) => s.showLoadingCanvas)
  const failed = useAppLoadingStore((s) => s.loaderFailed)
  return show && !failed ? <LoadingCanvasWorker /> : null
}

const loaderFailed = () => useAppLoadingStore.setState({ loaderFailed: true })

function Fallback() {
  useEffect(loaderFailed, [])
  return null
}

function LoadingCanvasWorker() {
  const { officeWireframe } = useAssets()
  const config = useNavigationStore((s) => s.currentScene?.cameraConfig)
  const scene = useNavigationStore((s) => s.currentScene?.name)
  const revealing = useAppLoadingStore((s) => s.isSceneRevealing)
  const [worker, setWorker] = useState<Worker | null>(null)

  useEffect(() => {
    let next: Worker
    try {
      next = new Worker(
        new URL("@/workers/loading-worker.tsx", import.meta.url),
        {
          type: "module"
        }
      )
    } catch (error) {
      Sentry.captureException(error, { tags: { worker: "loading" } })
      loaderFailed()
      return
    }
    const message = (
      event: MessageEvent<{ type: string; progress?: number }>
    ) => {
      const forwarded = workerErrorFromMessage(event.data)
      if (forwarded) {
        Sentry.captureException(forwarded, { tags: { worker: "loading" } })
        loaderFailed()
      } else if (event.data.type === "offscreen-canvas-loaded") {
        performance.mark("graphics:loader-frame")
        useAppLoadingStore.setState({ hasLoaderFrame: true })
      } else if (
        event.data.type === "loading-reveal-progress" &&
        typeof event.data.progress === "number"
      ) {
        useAppLoadingStore.getState().revealProgress.value = Math.min(
          1,
          event.data.progress
        )
      } else if (event.data.type === "loading-transition-complete") {
        useAppLoadingStore.setState({ loaderTransitionComplete: true })
      } else if (event.data.type === "error") {
        loaderFailed()
      }
    }
    const error = (event: Event) => {
      event.preventDefault()
      const { error, detail } = workerErrorReport(event, "loading")
      Sentry.captureException(error, {
        tags: { worker: "loading" },
        ...(detail ? { extra: { detail } } : {})
      })
      loaderFailed()
    }
    next.addEventListener("message", message)
    next.addEventListener("error", error)
    next.addEventListener("messageerror", error)
    next.postMessage({ type: "initialize", modelUrl: officeWireframe })
    setWorker(next)
    return () => {
      next.removeEventListener("message", message)
      next.removeEventListener("error", error)
      next.removeEventListener("messageerror", error)
      next.terminate()
    }
  }, [officeWireframe])

  useEffect(() => {
    if (!worker || !config) return
    worker.postMessage({
      type: "update-camera-config",
      actualCamera: {
        position: new Vector3(...config.position),
        target: new Vector3(...config.target),
        fov: config.fov
      }
    })
  }, [worker, config])

  useEffect(() => {
    worker?.postMessage({
      type: "update-loading-status",
      isAppLoaded: revealing
    })
  }, [worker, revealing])

  return (
    <div
      data-scene-loader={revealing ? "revealing" : "loading"}
      className={cn(
        "absolute inset-0 z-[1]",
        (scene === "basketball" || scene === "lab" || scene === "404") &&
          "inset-x-0 top-0 h-[100svh]",
        !revealing && "bg-black"
      )}
      aria-hidden="true"
    >
      {worker && (
        <OffscreenCanvas
          worker={worker}
          fallback={<Fallback />}
          frameloop="always"
          gl={{ antialias: true, alpha: true }}
        />
      )}
    </div>
  )
}
