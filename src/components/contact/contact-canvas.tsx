"use client"

import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import { useEffect, useState, useCallback, useMemo } from "react"

import { useAssets } from "../assets-provider"
import { useContactStore } from "./contact-store"
import ContactScreen from "./contact-screen"

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
  | "update-screen-skinned-matrix"
  | "screen-dimensions"
  | "submit-clicked"
  | "window-resize"
  | "load-model"
  | "update-contact-open"

const ContactCanvas = () => {
  const { contactPhone } = useAssets()
  const worker = useContactStore((state) => state.worker)
  const setStoreWorker = useContactStore((state) => state.setWorker)
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const isAnimating = useContactStore((state) => state.isAnimating)
  const setIsAnimating = useContactStore((state) => state.setIsAnimating)
  const setIntroCompleted = useContactStore((state) => state.setIntroCompleted)
  const setClosingCompleted = useContactStore(
    (state) => state.setClosingCompleted
  )
  const [shouldRender, setShouldRender] = useState(false)

  const handleAnimationComplete = useCallback(
    (setCompleteFunc: (val: boolean) => void) => {
      setCompleteFunc(true)
      setIsAnimating(false)
    },
    [setIsAnimating]
  )

  const handlePassThrough = useCallback(
    (type: WorkerMessageType) => {
      if (worker) {
        worker.postMessage({ type })
      }
    },
    [worker]
  )

  const messageHandlers = useMemo(
    () =>
      ({
        "outro-complete": () => handleAnimationComplete(setClosingCompleted),
        "animation-rejected": () => setIsAnimating(false),
        "start-outro": () => handlePassThrough("start-outro"),
        "run-outro-animation": () => handlePassThrough("run-outro-animation"),
        "scale-animation-complete": () =>
          handleAnimationComplete(setIntroCompleted),
        "scale-down-animation-complete": () => {
          setShouldRender(false)
          handleAnimationComplete(setClosingCompleted)
        },
        "animation-starting": () => setIsAnimating(true),
        "animation-complete": () => setIsAnimating(false)
      }) as const,
    [
      handleAnimationComplete,
      handlePassThrough,
      setClosingCompleted,
      setIntroCompleted,
      setIsAnimating
    ]
  )

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
      const handler = messageHandlers[type as keyof typeof messageHandlers]
      if (handler) handler()
    }

    worker.addEventListener("message", handleWorkerMessage)
    return () => worker.removeEventListener("message", handleWorkerMessage)
  }, [worker, messageHandlers])

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

    let rafId: number
    const handleResize = () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }

      rafId = requestAnimationFrame(() => {
        if (newWorker) {
          newWorker.postMessage({
            type: "window-resize",
            windowDimensions: {
              width: window.innerWidth,
              height: window.innerHeight
            }
          })
        }
      })
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      newWorker.terminate()
      setStoreWorker(null)
    }
  }, [contactPhone, setStoreWorker])

  useEffect(() => {
    if (worker) {
      worker.postMessage({
        type: "update-contact-open",
        isContactOpen: isContactOpen
      })
    }
  }, [worker, isContactOpen])

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

export default ContactCanvas
