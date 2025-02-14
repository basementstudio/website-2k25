"use client"

import { Canvas } from "@react-three/fiber"
import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import { lazy, useEffect, useState } from "react"

import { useAssets } from "../assets-provider"
import ContactScene from "./contact-scene"
import UiOverlay from "./ui/ui-overlay"

const Fallback = lazy(() => import("./fallback"))

const ContactCanvas = ({ isContactOpen }: { isContactOpen: boolean }) => {
  const { contactPhone } = useAssets()
  const [worker, setWorker] = useState<Worker>()

  useEffect(() => {
    const newWorker = new Worker(
      new URL("@/workers/contact-worker.tsx", import.meta.url),
      {
        type: "module"
      }
    )
    setWorker(newWorker)

    if (contactPhone) {
      newWorker.postMessage({
        type: "load-model",
        modelUrl: contactPhone
      })
    }

    return () => {
      newWorker.terminate()
    }
  }, [contactPhone])

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

      <UiOverlay className="fixed left-[42.5%] top-[53.5%] h-max w-[530px] -translate-x-1/2 -translate-y-1/2 bg-black opacity-50" />
    </>
  )
}

export default ContactCanvas
