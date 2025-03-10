import { useEffect, useState } from "react"
import { motion, useAnimation } from "motion/react"

interface ContactScreenProps {
  worker: Worker
}

const ContactScreen = ({ worker }: ContactScreenProps) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!worker) return

    worker.addEventListener("message", (e) => {
      if (e.data.type === "scale-type") {
        if (e.data.scale === "scale-up") {
          setIsVisible(true)
        } else {
          setIsVisible(false)
        }
      }
    })
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
      className="absolute left-[516px] top-[330px] z-50 h-[344px] w-[556px] bg-brand-k"
      initial={{ scaleX: 0, scaleY: 0 }}
      animate={animation}
      style={{
        originX: 0.5,
        originY: 0.5,
        transformStyle: "preserve-3d"
      }}
    />
  )
}

export default ContactScreen
