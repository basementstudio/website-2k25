import { useEffect, useRef, useState } from "react"

interface ContactScreenProps {
  worker: Worker
}

const ContactScreen = ({ worker }: ContactScreenProps) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const updatePositionRef = useRef<(() => void) | null>(null)
  const [screenPosition, setScreenPosition] = useState({ x: 0.5, y: 0.5, z: 0 })

  useEffect(() => {
    if (!worker) return

    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "update-screen-skinned-matrix") {
        const { screenPos } = e.data

        requestAnimationFrame(() => {
          setScreenPosition(screenPos)
        })
      }
    }

    worker.addEventListener("message", handleMessage)

    return () => {
      worker.removeEventListener("message", handleMessage)
      if (updatePositionRef.current) {
        window.removeEventListener("resize", updatePositionRef.current)
      }
    }
  }, [worker])

  return (
    <>
      <div
        ref={contentRef}
        style={{
          position: "absolute",
          left: `${screenPosition.x * 100}%`,
          top: `${screenPosition.y * 100}%`,
          transform: "translate(-50%, -50%)",
          zIndex: 100,
          pointerEvents: "none"
        }}
      >
        <div
          className="relative flex h-[310px] w-[510px] bg-transparent p-2"
          style={{
            transform: "perspective(300px) rotateY(.5deg)",
            transformOrigin: "center center"
          }}
        >
          <div className="h-full w-full border-2 border-brand-o">
            <span className="text-center text-[8px] font-bold text-white">
              {screenPosition.x.toFixed(4)}, {screenPosition.y.toFixed(4)}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default ContactScreen
