import { Canvas } from "@react-three/offscreen"
import { lazy } from "react"

const Fallback = lazy(() => import("./fallback"))

const worker = new Worker(
  new URL("@/workers/contact-worker.tsx", import.meta.url),
  {
    type: "module"
  }
)

const ContactCanvas = () => {
  return (
    <Canvas
      worker={worker}
      fallback={<Fallback />}
      shadows
      camera={{ position: [0, 0, 10], fov: 25 }}
    />
  )
}

export default ContactCanvas
