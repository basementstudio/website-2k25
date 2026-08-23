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
  const setWorkerReady = useContactStore((state) => state.setWorkerReady)
  const workerReady = useContactStore((state) => state.workerReady)
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

    const handleWorkerMessage = (e: MessageEvent) => {
      const { type } = e.data

      const forwarded = workerErrorFromMessage(e.data)
      if (forwarded) {
        Sentry.captureException(forwarded, { tags: { worker: "contact" } })
        return
      }

      const setAnimComplete = (setCompleteFunc: (val: boolean) => void) => {
        setCompleteFunc(true)
        setIsAnimating(false)
      }

      const passThrough = () => worker.postMessage({ type })

      const messageHandlers: Partial<Record<WorkerMessageType, () => void>> = {
        "scene-ready": () => setWorkerReady(true),
        "outro-complete": () => {
          setAnimComplete(setClosingCompleted)
        },
        "animation-rejected": () => setIsAnimating(false),
        "start-outro": passThrough,
        "run-outro-animation": passThrough,
        "scale-animation-complete": () => setAnimComplete(setIntroCompleted),
        "scale-down-animation-complete": () => {
          setShouldRender(false)
          setAnimComplete(setClosingCompleted)
        },
        "animation-starting": () => setIsAnimating(true),
        "animation-complete": () => setIsAnimating(false)
      }

      const handler = messageHandlers[type as WorkerMessageType]
      if (handler) handler()
    }

    worker.addEventListener("message", handleWorkerMessage)
    return () => worker.removeEventListener("message", handleWorkerMessage)
  }, [
    worker,
    setIsAnimating,
    setWorkerReady,
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
    setWorkerReady(false)
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
      setWorkerReady(false)
    }
  }, [contactPhone, setStoreWorker, setWorkerReady])

  // Replay an open issued before the scene existed (cold open), and keep
  // the worker's open state in sync otherwise.
  useEffect(() => {
    if (!worker || !workerReady) return
    if (!isContactOpen) return

    worker.postMessage({
      type: "update-contact-open",
      isContactOpen: true,
      isClosing: false
    })
  }, [worker, workerReady, isContactOpen])

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
