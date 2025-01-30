"use client"
import { Canvas } from "@react-three/offscreen"
import { lazy, useEffect, useState } from "react"

import { useAssets } from "../assets-provider"

const Fallback = lazy(() => import("./fallback"))

const ContactCanvas = () => {
  const { contactPhone, arcade } = useAssets()
  const [worker, setWorker] = useState<Worker>()

  useEffect(() => {
    const newWorker = new Worker(
      new URL("@/workers/contact-worker.tsx", import.meta.url),
      {
        type: "module"
      }
    )
    setWorker(newWorker)

    if (contactPhone && arcade) {
      newWorker.postMessage({
        type: "load-model",
        modelUrl: contactPhone,
        idleUrl: arcade.idleScreen
      })
    }

    return () => {
      newWorker.terminate()
    }
  }, [contactPhone, arcade])

  console.log("[ContactCanvas] model url", contactPhone)

  if (!worker) {
    return <Fallback />
  }

  return (
    <Canvas
      worker={worker}
      fallback={<Fallback />}
      shadows
      camera={{ position: [0, 0.082, 5.25], fov: 25 }}
      gl={{ antialias: false }}
    />
  )
}

export default ContactCanvas

// "use client"
// import { Canvas } from "@react-three/offscreen"
// import { lazy } from "react"

// import { useAssets } from "../assets-provider"

// const Fallback = lazy(() => import("./fallback"))

// const worker = new Worker(
//   new URL("@/workers/contact-worker.tsx", import.meta.url),
//   {
//     type: "module"
//   }
// )

// const ContactCanvas = () => {
//   const { contactPhone, arcade } = useAssets()
//   console.log("[ContactCanvas] model url", contactPhone)

//   worker.postMessage({
//     type: "load-model",
//     modelUrl: contactPhone,
//     idleUrl: arcade.idleScreen
//   })

//   return (
//     <Canvas
//       worker={worker}
//       fallback={<Fallback />}
//       shadows
//       camera={{ position: [0, 0.082, 5.25], fov: 25 }}
//       gl={{ antialias: false }}
//     />
//   )
// }

// export default ContactCanvas
