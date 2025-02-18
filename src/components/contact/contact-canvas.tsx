"use client"

import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import { lazy, useEffect, useState } from "react"

import { useAssets } from "../assets-provider"
import { useContactStore } from "./contact-store"
import UiOverlay from "./ui/ui-overlay"

const Fallback = lazy(() => import("./fallback"))

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

  if (!worker) {
    return <Fallback />
  }

  return (
    <>
      <OffscreenCanvas
        worker={worker}
        fallback={<Fallback />}
        frameloop={isContactOpen ? "always" : "never"}
        camera={{ position: [0, 0.082, 5.25], fov: 25 }}
        gl={{ antialias: false }}
      />

      <UiOverlay className="fixed left-[42.5%] top-[53.5%] h-max w-[530px] -translate-x-1/2 -translate-y-1/2 opacity-40" />
    </>
  )
}

export default ContactCanvas
