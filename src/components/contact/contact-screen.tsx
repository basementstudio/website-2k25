import { submitContactForm } from "@/actions/contact-form"
import { useEffect, useRef, useState } from "react"
import { motion, useAnimation } from "motion/react"
import { useContactStore } from "./contact-store"

const ContactScreen = () => {
  // State
  const contentRef = useRef(null)
  const updatePositionRef = useRef<(() => void) | null>(null)
  const [screenPosition, setScreenPosition] = useState({ x: 0.5, y: 0.5, z: 0 })
  const [scale, setScale] = useState(1)
  const animation = useAnimation()
  const worker = useContactStore((state) => state.worker)

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    budget: "",
    message: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const isValid = formData.email.trim() !== "" && formData.message.trim() !== ""

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const result = await submitContactForm(formData)
      if (result.success) {
        setFormData({
          name: "",
          company: "",
          email: "",
          budget: "",
          message: ""
        })
      }
    } catch (error) {
      console.error("Failed to submit form:", error)
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!worker) return

    const handleMessage = (e: MessageEvent) => {
      const { type, screenPos } = e.data

      if (type === "update-screen-skinned-matrix") {
        requestAnimationFrame(() => setScreenPosition(screenPos))
      } else if (type === "intro-complete") {
        animation
          .start({
            scaleX: [0, 0, 1, 1],
            scaleY: [0, 0.01, 0.01, 1],
            transition: {
              duration: 0.6,
              times: [0, 0.2, 0.6, 1],
              ease: "easeOut"
            }
          })
          .then(() => worker.postMessage({ type: "scale-animation-complete" }))
      } else if (type === "start-outro") {
        animation
          .start({
            scaleX: [1, 1, 0, 0],
            scaleY: [1, 0.01, 0.01, 0],
            transition: {
              duration: 0.6,
              times: [0, 0.4, 0.8, 1],
              ease: "easeIn"
            }
          })
          .then(() => worker.postMessage({ type: "run-outro-animation" }))
      } else if (type === "outro-complete") {
        setTimeout(
          () => worker.postMessage({ type: "scale-down-animation-complete" }),
          500
        )
      }
    }

    worker.addEventListener("message", handleMessage)
    return () => {
      worker.removeEventListener("message", handleMessage)
      if (updatePositionRef.current) {
        window.removeEventListener("resize", updatePositionRef.current)
      }
    }
  }, [worker, animation])

  useEffect(() => {
    const updateScale = () => {
      const baseHeight = 310
      const baseWidth = 510
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      const heightScale = (viewportHeight * 0.9) / baseHeight
      const widthScale = viewportWidth / baseWidth
      let baseScale = Math.min(heightScale, widthScale)

      let finalScale
      if (baseScale < 0.8) {
        finalScale = Math.max(0.6, baseScale)
      } else if (baseScale > 1.5) {
        finalScale = 1.4 * (1 - Math.exp(-baseScale + 1.5))
      } else {
        finalScale = 0.8 + (baseScale - 0.8) * 0.5
      }

      setScale(Math.max(0.6, Math.min(1.4, finalScale)))
    }

    updateScale()
    window.addEventListener("resize", updateScale)
    updatePositionRef.current = updateScale

    return () => window.removeEventListener("resize", updateScale)
  }, [])

  return (
    <div
      ref={contentRef}
      style={{
        position: "absolute",
        left: `${screenPosition.x * 100}%`,
        top: `${screenPosition.y * 100}%`,
        transform: `translate(-50%, -50%)`,
        zIndex: 100
      }}
    >
      <div
        className="relative flex w-[510px] bg-transparent"
        style={{
          transform: `perspective(400px) rotateY(0.5deg) scale(${scale})`,
          transformOrigin: "center center"
        }}
      >
        <motion.div
          className="h-full w-full"
          initial={{ scaleX: 0, scaleY: 0 }}
          animate={animation}
        >
          <div className="flex h-full w-full flex-col justify-between gap-7 text-[13px] text-brand-o">
            <form
              onSubmit={handleSubmit}
              className="relative flex h-full w-full flex-col justify-between gap-4 border border-brand-o pb-4 pt-6 uppercase"
            >
              <fieldset className="absolute -top-[10px] left-[10px]">
                <legend className="bg-black px-1">fill in the form</legend>
              </fieldset>

              <div className="grid grid-cols-2 gap-2 px-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="NAME"
                  className="h-6 border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                />
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="COMPANY"
                  className="h-6 border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                />
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="EMAIL"
                  className="col-span-2 h-6 border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                />
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  placeholder="BUDGET (OPTIONAL)"
                  className="col-span-2 h-6 border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                />
                <textarea
                  required
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="MESSAGE"
                  className="col-span-2 h-16 resize-none border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                />
              </div>

              <div className="w-full px-4">
                <button
                  className={`h-8 w-full border px-2 py-1 text-center ${
                    isValid
                      ? "cursor-pointer border-none bg-brand-o text-black"
                      : "cursor-default border-brand-o/50 text-brand-o/50"
                  }`}
                >
                  {submitting ? "SUBMITTING..." : "SUBMIT MESSAGE →"}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between gap-2 text-[13px] uppercase text-brand-o">
              <div className="flex items-center gap-2">
                <a
                  href="https://x.com/basementstudio"
                  target="_blank"
                  className="underline underline-offset-4"
                >
                  x (twitter)
                </a>
                <span>,</span>
                <a
                  href="https://www.instagram.com/basementdotstudio/"
                  target="_blank"
                  className="underline underline-offset-4"
                >
                  instagram
                </a>
                <span>,</span>
                <a
                  href="https://github.com/basementstudio"
                  target="_blank"
                  className="underline underline-offset-4"
                >
                  github
                </a>
              </div>
              <a
                href="mailto:hello@basement.studio"
                target="_blank"
                className="underline underline-offset-4"
              >
                hello@basement.studio
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ContactScreen
