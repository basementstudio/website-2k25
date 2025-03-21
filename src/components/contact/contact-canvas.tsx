"use client"

import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import { useEffect, useState } from "react"

import { useAssets } from "../assets-provider"
import { useContactStore } from "./contact-store"
import ContactScreen from "./contact-screen"

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

const ContactCanvas = () => {
  const { contactPhone } = useAssets()
  const worker = useContactStore((state) => state.worker)
  const setStoreWorker = useContactStore((state) => state.setWorker)
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const setIsAnimating = useContactStore((state) => state.setIsAnimating)
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

      const setAnimComplete = (setCompleteFunc: (val: boolean) => void) => {
        setCompleteFunc(true)
        setIsAnimating(false)
      }

      const passThrough = () => worker.postMessage({ type })

      const messageHandlers: Partial<Record<WorkerMessageType, () => void>> = {
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
        }
      }

      const handler = messageHandlers[type as WorkerMessageType]
      if (handler) handler()
    }

    worker.addEventListener("message", handleWorkerMessage)
    return () => worker.removeEventListener("message", handleWorkerMessage)
  }, [worker, setIsAnimating, setIntroCompleted, setClosingCompleted])

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

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
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
        frameloop={shouldRender ? "always" : "never"}
        camera={{ position: [0, 0.2, 2], fov: 8.5 }}
        gl={{ antialias: false }}
      />
    </>
  )
}

export default ContactCanvas
