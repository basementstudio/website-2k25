"use client"

import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import { useEffect, useState } from "react"

import { useAssets } from "../assets-provider"
import { useContactStore } from "./contact-store"
import ContactScreen from "./contact-screen"

const ContactCanvas = ({ isContactOpen }: { isContactOpen: boolean }) => {
  const { contactPhone } = useAssets()
  const [worker, setWorker] = useState<Worker>()
  const setStoreWorker = useContactStore((state) => state.setWorker)

  useEffect(() => {
    const newWorker = new Worker(
      new URL("@/workers/contact-worker.tsx", import.meta.url),
      {
        type: "module"
      }
    )
    setWorker(newWorker)
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
      <ContactScreen worker={worker}>
        <div className="h-[330px] w-[545px] bg-red-500" />
      </ContactScreen>
      <OffscreenCanvas
        worker={worker}
        fallback={null}
        frameloop={isContactOpen ? "always" : "never"}
        camera={{ position: [0, 0.082, 5.25], fov: 25 }}
        gl={{ antialias: false }}
      />
    </>
  )
}

export default ContactCanvas
