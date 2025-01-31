"use client"
import { Canvas } from "@react-three/offscreen"
import { lazy, useEffect, useState } from "react"

import { useAssets } from "../assets-provider"

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

  console.log("[ContactCanvas] model url", contactPhone)

  if (!worker) {
    return <Fallback />
  }

  return (
    <Canvas
      worker={worker}
      fallback={<Fallback />}
      shadows
      frameloop={isContactOpen ? "always" : "never"}
      camera={{ position: [0, 0.082, 5.25], fov: 25 }}
      gl={{ antialias: false }}
    />
  )
}

export default ContactCanvas
