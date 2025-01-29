import { Canvas } from "@react-three/offscreen"
import { lazy } from "react"

import { useAssets } from "../assets-provider"

const Fallback = lazy(() => import("./fallback"))

const worker = new Worker(
  new URL("@/workers/contact-worker.tsx", import.meta.url),
  {
    type: "module"
  }
)

const ContactCanvas = () => {
  const { contactPhone } = useAssets()
  console.log("[ContactCanvas] model url", contactPhone)

  worker.postMessage({ type: "load-model", modelUrl: contactPhone })

  return (
    <Canvas
      worker={worker}
      fallback={<Fallback />}
      shadows
      camera={{ position: [0, 0.082, 5.25], fov: 35 }}
      gl={{ antialias: false }}
    />
  )
}

export default ContactCanvas
