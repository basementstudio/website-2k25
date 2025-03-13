"use client"

import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import { useEffect, useState } from "react"

import { useAssets } from "../assets-provider"
import { useContactStore } from "./contact-store"
import ContactScreen from "./contact-screen"

const ContactCanvas = () => {
  const { contactPhone } = useAssets()
  const worker = useContactStore((state) => state.worker)
  const setStoreWorker = useContactStore((state) => state.setWorker)
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const setIsAnimating = useContactStore((state) => state.setIsAnimating)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isContactOpen) {
      setIsAnimating(true)
      setShouldRender(true)
    } else if (!isContactOpen && shouldRender) {
      setIsAnimating(true)
      const safetyTimer = setTimeout(() => {
        setShouldRender(false)
      }, 3500)
      return () => clearTimeout(safetyTimer)
    }
  }, [isContactOpen, shouldRender, setIsAnimating])

  useEffect(() => {
    if (!worker) return

    const handleWorkerMessage = (e: MessageEvent) => {
      if (e.data.type === "outro-complete") {
        setShouldRender(false)
        setIsAnimating(false)
      } else if (e.data.type === "intro-complete") {
        setIsAnimating(false)
      } else if (e.data.type === "animation-rejected") {
        setIsAnimating(false)
      }
    }

    worker.addEventListener("message", handleWorkerMessage)
    return () => worker.removeEventListener("message", handleWorkerMessage)
  }, [worker, setIsAnimating])

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
        modelUrl: contactPhone
      })
    }

    return () => {
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
        camera={{ position: [0, 0.2, 2], fov: 10 }}
        gl={{ antialias: false }}
      />
    </>
  )
}

export default ContactCanvas
