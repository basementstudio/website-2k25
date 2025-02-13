"use client"

import { Canvas } from "@react-three/fiber"
import { Canvas as OffscreenCanvas } from "@react-three/offscreen"
import { lazy, useEffect, useState } from "react"

import { useAssets } from "../assets-provider"
import ContactScene from "./contact-scene"

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
      <script
        type="text/partytown"
        dangerouslySetInnerHTML={{
          __html: `
            console.log("hello partytown");
          `
        }}
      />
      {/* <OffscreenCanvas
        worker={worker}
        fallback={<Fallback />}
        frameloop={isContactOpen ? "always" : "never"}
        camera={{ position: [0, 0.082, 5.25], fov: 25 }}
        gl={{ antialias: false }}
      /> */}
      <Canvas
        gl={{ antialias: false }}
        camera={{ position: [0, 0.082, 5.25], fov: 25 }}
      >
        <ContactScene modelUrl={contactPhone} />
      </Canvas>
    </>
  )
}

export default ContactCanvas
