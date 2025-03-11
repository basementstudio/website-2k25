import { useEffect, useState } from "react"
import { motion, useAnimation } from "motion/react"
import * as THREE from "three"

interface ContactScreenProps {
  worker: Worker
}

const ContactScreen = ({ worker }: ContactScreenProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [screenPosition, setScreenPosition] = useState({ x: 516, y: 329 })

  useEffect(() => {
    if (!worker) return

    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "scale-type") {
        if (e.data.scale === "scale-up") {
          setIsVisible(true)
        } else {
          setIsVisible(false)
        }
      }

      if (e.data.type === "update-screen-skinned-matrix") {
        const { screenboneMatrix, cameraMatrix } = e.data
        const updatePosition = () => {
          const boneMatrix = new THREE.Matrix4().fromArray(screenboneMatrix)
          const camMatrix = new THREE.Matrix4().fromArray(cameraMatrix)

          const position = new THREE.Vector3()
          position.setFromMatrixPosition(boneMatrix)

          const camera = new THREE.PerspectiveCamera()
          camera.matrixWorld.copy(camMatrix)
          position.project(camera)

          const screenOffset = window.innerWidth >= 1700 ? 350 : 360
          const x = ((position.x + 1) * window.innerWidth) / 2 - screenOffset
          const y = ((-position.y + 1) * window.innerHeight) / 2 + 116

          setScreenPosition({ x, y })
        }

        updatePosition()
        window.addEventListener("resize", updatePosition)
      }
    }

    worker.addEventListener("message", handleMessage)

    return () => {
      worker.removeEventListener("message", handleMessage)
    }
  }, [worker])

  const animation = useAnimation()

  useEffect(() => {
    if (isVisible) {
      animation.start({
        scaleX: [0, 0, 1, 1],
        scaleY: [0, 0.01, 0.01, 1],
        transition: {
          duration: 0.6,
          times: [0, 0.2, 0.6, 1],
          ease: "easeOut"
        }
      })
    } else {
      animation.start({
        scaleX: [1, 1, 0, 0],
        scaleY: [1, 0.01, 0.01, 0],
        transition: {
          duration: 0.6,
          times: [0, 0.4, 0.8, 1],
          ease: "easeIn"
        }
      })
    }
  }, [isVisible, animation])

  return (
    <motion.div
      className="absolute z-50 flex h-[346px] w-[559px] bg-brand-k px-4 pb-6 pt-5 font-bold"
      style={{
        left: `${screenPosition.x}px`,
        top: `${screenPosition.y}px`,
        originX: 0.5,
        originY: 0.5,
        transformStyle: "preserve-3d"
      }}
      initial={{ scaleX: 0, scaleY: 0 }}
      animate={animation}
    >
      <div className="flex h-full w-full flex-col gap-9">
        <div className="relative h-full w-full border border-brand-o px-4 pt-6">
          <p className="absolute -top-3 left-3 bg-brand-k px-1 uppercase text-brand-o">
            fill in the form
          </p>
          <form className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
            <input
              type="text"
              placeholder="NAME"
              className="h-fit border-b border-dashed border-brand-o bg-transparent px-1 pb-2 uppercase text-brand-o/50 placeholder:text-brand-o/50"
            />
            <input
              type="text"
              placeholder="COMPANY"
              className="h-fit border-b border-dashed border-brand-o bg-transparent px-1 pb-2 uppercase text-brand-o/50 placeholder:text-brand-o/50"
            />
            <input
              type="email"
              placeholder="EMAIL"
              className="col-span-2 h-fit border-b border-dashed border-brand-o bg-transparent px-1 pb-2 uppercase text-brand-o/50 placeholder:text-brand-o/50"
            />
            <input
              type="text"
              placeholder="BUDGET (OPTIONAL)"
              className="col-span-2 h-fit border-b border-dashed border-brand-o bg-transparent px-1 pb-2 uppercase text-brand-o/50 placeholder:text-brand-o/50"
            />
            <textarea
              placeholder="MESSAGE"
              className="focus col-span-2 h-full resize-none border-b border-dashed border-brand-o bg-transparent px-1 pb-2 uppercase text-brand-o/50 placeholder:text-brand-o/50"
            />
          </form>
        </div>
        <div className="flex items-center justify-between gap-2 text-[13px] uppercase text-brand-o">
          <div className="flex items-center gap-2 underline underline-offset-4">
            <p>x (twitter)</p>
            <p>instagram</p>
            <p>github</p>
          </div>

          <p>hello@basement.studio</p>
        </div>
      </div>
    </motion.div>
  )
}

export default ContactScreen
