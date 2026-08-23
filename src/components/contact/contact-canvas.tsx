"use client"

import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import * as Sentry from "@sentry/nextjs"
import { useEffect, useState } from "react"

import { useAssets } from "@/components/assets-provider"
import { workerErrorFromMessage, workerErrorReport } from "@/lib/worker-error"

import { ContactScreen } from "./contact-screen"
import { useContactStore } from "./contact-store"

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), ms)
  }
}

type WorkerMessageType =
  | "outro-complete"
  | "intro-complete"
  | "animation-rejected"
  | "start-outro"
  | "run-outro-animation"
  | "scale-animation-complete"
  | "scale-down-animation-complete"
  | "animation-starting"
  | "animation-complete"
  | "scene-ready"

export const ContactCanvas = () => {
  const { contactPhone } = useAssets()
  const worker = useContactStore((state) => state.worker)
  const setStoreWorker = useContactStore((state) => state.setWorker)
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const isAnimating = useContactStore((state) => state.isAnimating)
  const setIsAnimating = useContactStore((state) => state.setIsAnimating)
  const setSceneReady = useContactStore((state) => state.setSceneReady)
  const setIntroCompleted = useContactStore((state) => state.setIntroCompleted)
  const setClosingCompleted = useContactStore(
    (state) => state.setClosingCompleted
  )
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isContactOpen) {
      setIsAnimating(true)
      setShouldRender(true)
      setIntroCompleted(false)
    } else if (!isContactOpen && shouldRender) {
      setIsAnimating(true)
      setClosingCompleted(false)
    }
  }, [
    isContactOpen,
    shouldRender,
    setIsAnimating,
    setIntroCompleted,
    setClosingCompleted
  ])

  useEffect(() => {
    if (!worker) return

    const setAnimComplete = (setCompleteFunc: (val: boolean) => void) => {
      setCompleteFunc(true)
      setIsAnimating(false)
    }

    const passThrough = (type: WorkerMessageType) => () =>
      worker.postMessage({ type })

    // Built once: the worker also posts per-frame messages that miss this table.
    const messageHandlers: Partial<Record<WorkerMessageType, () => void>> = {
      // The store skips its own postMessage while the canvas is unmounted, so
      // an open issued before the scene existed has to be replayed here.
      "scene-ready": () => {
        setSceneReady(true)
        if (!useContactStore.getState().isContactOpen) return

        worker.postMessage({
          type: "update-contact-open",
          isContactOpen: true,
          isClosing: false
        })
      },
      "outro-complete": () => {
        setAnimComplete(setClosingCompleted)
      },
      "animation-rejected": () => setIsAnimating(false),
      "start-outro": passThrough("start-outro"),
      "run-outro-animation": passThrough("run-outro-animation"),
      "scale-animation-complete": () => setAnimComplete(setIntroCompleted),
      "scale-down-animation-complete": () => {
        setShouldRender(false)
        setAnimComplete(setClosingCompleted)
      },
      "animation-starting": () => setIsAnimating(true),
      "animation-complete": () => setIsAnimating(false)
    }

    const handleWorkerMessage = (e: MessageEvent) => {
      const forwarded = workerErrorFromMessage(e.data)
      if (forwarded) {
        Sentry.captureException(forwarded, { tags: { worker: "contact" } })
        return
      }

      messageHandlers[e.data.type as WorkerMessageType]?.()
    }

    worker.addEventListener("message", handleWorkerMessage)
    return () => worker.removeEventListener("message", handleWorkerMessage)
  }, [
    worker,
    setIsAnimating,
    setSceneReady,
    setIntroCompleted,
    setClosingCompleted
  ])

  useEffect(() => {
    const newWorker = new Worker(
      new URL("@/workers/contact-worker.tsx", import.meta.url),
      {
        type: "module"
      }
    )
    setStoreWorker(newWorker)

    if (contactPhone) {
      newWorker.postMessage({
        type: "load-model",
        modelUrl: contactPhone,
        windowDimensions: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      })
    }

    const debouncedResizeHandler = debounce(() => {
      if (newWorker) {
        newWorker.postMessage({
          type: "window-resize",
          windowDimensions: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        })
      }
    }, 250)

    const handleResize = () => {
      if (newWorker) {
        newWorker.postMessage({
          type: "window-resize",
          windowDimensions: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        })
      }
      debouncedResizeHandler()
    }

    const handleError = (event: Event) => {
      console.error("[ContactCanvas] Worker error:", event)
      // Uncanceled, it reaches window.onerror and Sentry files a second copy.
      event.preventDefault()

      const { error, detail } = workerErrorReport(event, "contact")
      Sentry.captureException(error, {
        tags: { worker: "contact" },
        ...(detail ? { extra: { detail } } : {})
      })
    }

    newWorker.addEventListener("error", handleError)
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      newWorker.removeEventListener("error", handleError)
      newWorker.terminate()
      setStoreWorker(null)
      setSceneReady(false)
    }
  }, [contactPhone, setStoreWorker, setSceneReady])

  if (!worker) return null

  return (
    <>
      <ContactScreen />
      <OffscreenCanvas
        worker={worker}
        fallback={null}
        frameloop={shouldRender || isAnimating ? "always" : "never"}
        camera={{ position: [0, 0.2, 2], fov: 8.5 }}
        gl={{ antialias: false }}
      />
    </>
  )
}
