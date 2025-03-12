import { useEffect, useRef, useState } from "react"

interface ContactScreenProps {
  worker: Worker
}

const ContactScreen = ({ worker }: ContactScreenProps) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const updatePositionRef = useRef<(() => void) | null>(null)
  const [screenPosition, setScreenPosition] = useState({ x: 0.5, y: 0.5, z: 0 })
  const [scale, setScale] = useState(1)

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

  useEffect(() => {
    const updateScale = () => {
      const minHeight = 310
      const viewportHeight = window.innerHeight
      const newScale = Math.min(1, (viewportHeight * 0.32) / minHeight)
      setScale(newScale)
    }

    updateScale()
    window.addEventListener("resize", updateScale)
    updatePositionRef.current = updateScale

    return () => {
      window.removeEventListener("resize", updateScale)
    }
  }, [])

  return (
    <>
      <div
        ref={contentRef}
        style={{
          position: "absolute",
          left: `${screenPosition.x * 100}%`,
          top: `${screenPosition.y * 100}%`,
          transform: `translate(-50%, -50%) `,
          zIndex: 100
        }}
      >
        <div
          className="relative flex h-[300px] w-[510px] bg-transparent"
          style={{
            transform: `perspective(300px) rotateY(.5deg) scale(${scale})`,
            transformOrigin: "center center"
          }}
        >
          <div className="h-full w-full">
            <div className="flex h-full w-full flex-col justify-between gap-7 text-[13px] text-brand-o">
              <form className="relative flex h-full w-full flex-col justify-between border border-brand-o pb-4 pt-6 uppercase">
                <fieldset className="absolute -top-[10px] left-[10px]">
                  <legend className="bg-black px-1">fill in the form</legend>
                </fieldset>
                <div className="grid grid-cols-2 gap-2 px-4">
                  <input
                    type="text"
                    placeholder="NAME"
                    className="h-6 border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                  />
                  <input
                    type="text"
                    placeholder="COMPANY"
                    className="h-6 border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                  />
                  <input
                    type="email"
                    placeholder="EMAIL"
                    className="col-span-2 h-6 border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                  />
                  <input
                    type="number"
                    placeholder="BUDGET (OPTIONAL)"
                    className="col-span-2 h-6 border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                  />
                  <textarea
                    placeholder="MESSAGE"
                    className="col-span-2 h-16 resize-none border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                  />
                </div>
                <div className="w-full px-4">
                  <button className="h-8 w-full border border-brand-o/20 px-2 py-1 text-center">
                    SUBMIT MESSAGE →
                  </button>
                </div>
              </form>
              <div className="flex items-center justify-between gap-2 text-[13px] uppercase text-brand-o">
                <div className="flex items-center gap-2 underline underline-offset-4">
                  <a href="" target="_blank">
                    x (twitter)
                  </a>
                  <a href="" target="_blank">
                    instagram
                  </a>
                  <a href="" target="_blank">
                    github
                  </a>
                </div>

                <p>hello@basement.studio</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ContactScreen
