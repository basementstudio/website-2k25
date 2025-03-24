import { submitContactForm } from "@/actions/contact-form"
import { useEffect, useRef, useState } from "react"
import { motion, useAnimation } from "motion/react"
import { useContactStore } from "./contact-store"
import { SubmitHandler, useForm } from "react-hook-form"
import { Inputs } from "@/app/(pages)/contact/form/contact-form"
import { Link } from "../primitives/link"

const ContactScreen = () => {
  const contentRef = useRef(null)
  const updatePositionRef = useRef<(() => void) | null>(null)
  const animation = useAnimation()
  const worker = useContactStore((state) => state.worker)
  const closeContact = useContactStore.getState().setIsContactOpen

  const [submitting, setSubmitting] = useState(false)
  const [showSubmittedMessage, setShowSubmittedMessage] = useState(false)
  const [screenDimensions, setScreenDimensions] = useState({
    width: 580,
    height: 350
  })

  useEffect(() => {
    if (!worker) return

    const handleMessage = (e: MessageEvent) => {
      const { type, screenPos, dimensions } = e.data

      if (type === "update-screen-skinned-matrix") {
        if (contentRef.current) {
          const element = contentRef.current as HTMLDivElement
          element.style.left = `${screenPos.x * 100}%`
          element.style.top = `${screenPos.y * 100}%`
        }
      } else if (type === "intro-complete") {
        animation
          .start({
            scaleX: [0, 0, 1, 1],
            scaleY: [0, 0.01, 0.01, 1],
            transition: {
              duration: 0.4,
              times: [0, 0.2, 0.6, 1],
              ease: "easeOut"
            }
          })
          .then(() => {
            useContactStore.getState().setIntroCompleted(true)
            useContactStore.getState().setIsAnimating(false)
            worker.postMessage({ type: "scale-animation-complete" })
          })
      } else if (type === "start-outro") {
        animation
          .start({
            scaleX: [1, 1, 0, 0],
            scaleY: [1, 0.01, 0.01, 0],
            transition: {
              duration: 0.4,
              times: [0, 0.4, 0.8, 1],
              ease: "easeIn"
            }
          })
          .then(() => {
            worker.postMessage({ type: "run-outro-animation" })
          })
      } else if (type === "outro-complete") {
        setTimeout(() => {
          useContactStore.getState().setIsAnimating(false)
          worker.postMessage({ type: "scale-down-animation-complete" })
        }, 500)
      } else if (type === "screen-dimensions") {
        setScreenDimensions(dimensions)
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

  const { register, handleSubmit, reset, watch } = useForm<Inputs>()

  const email = watch("email")
  const message = watch("message")

  const isValid = !!email && !!message

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setSubmitting(true)

    setShowSubmittedMessage(false)

    if (worker) {
      worker.postMessage({ type: "submit-clicked" })
    }

    try {
      const formData = {
        name: data.name || "",
        company: data.company || "",
        email: data.email,
        budget: data.budget || "",
        message: data.message
      }

      const result = await submitContactForm(formData)

      if (result.success) {
        setShowSubmittedMessage(true)

        setTimeout(() => {
          setShowSubmittedMessage(false)

          if (worker) {
            worker.postMessage({ type: "start-outro" })

            closeContact(false)
          }
        }, 2000)

        reset()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      ref={contentRef}
      className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
    >
      <div
        className="relative flex bg-transparent"
        style={{
          width: `${screenDimensions.width}px`,
          height: `${screenDimensions.height}px`,
          transform: `perspective(400px) rotateY(0.5deg)`,
          transformOrigin: "center center"
        }}
      >
        <motion.div
          className="h-full w-full"
          initial={{ scaleX: 0, scaleY: 0 }}
          animate={animation}
        >
          <div className="font-flauta relative z-20 flex h-full w-full flex-col justify-between gap-7 text-[14px] text-brand-o">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="relative flex h-full w-full flex-col justify-between gap-4 border border-brand-o pb-4 pt-6 uppercase"
            >
              <fieldset className="absolute -top-[10px] left-[10px] z-10 -ml-px p-0">
                <legend className="bg-[#050505] px-1">CONTACT US</legend>
              </fieldset>

              <fieldset className="absolute -top-[10px] right-[10px] z-10 -mr-px p-0">
                <legend className="px-1">
                  <button
                    type="button"
                    className="hover:/90 bg-[#050505] px-1 uppercase transition-all duration-300"
                    onClick={() => {
                      const state = useContactStore.getState()
                      if (!state.isAnimating) {
                        closeContact(false)
                      }
                    }}
                  >
                    close
                  </button>
                </legend>
              </fieldset>

              <div className="flex h-full flex-col gap-2 px-4">
                <div className="flex w-full items-center gap-2">
                  <input
                    type="text"
                    placeholder="NAME"
                    className="border-contact h-8 w-full border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o"
                    {...register("name")}
                  />
                  <input
                    type="text"
                    placeholder="COMPANY"
                    className="border-contact h-8 w-full border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o"
                    {...register("company")}
                  />
                </div>
                <div className="flex w-full items-center gap-2">
                  <input
                    required
                    type="email"
                    placeholder="EMAIL"
                    className="border-contact col-span-2 h-8 w-full border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o"
                    {...register("email", { required: "Email is required" })}
                  />
                  <input
                    type="text"
                    placeholder="BUDGET (OPTIONAL)"
                    className="border-contact col-span-2 h-8 w-full border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o"
                    {...register("budget")}
                  />
                </div>
                <textarea
                  required
                  placeholder="MESSAGE"
                  className="border-contact col-span-2 h-full flex-1 resize-none border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o"
                  {...register("message", { required: "Message is required" })}
                />
              </div>

              <div className="w-full px-4">
                <button
                  className={`h-8 w-full border px-2 py-1 text-center transition-all duration-300 ${
                    isValid || showSubmittedMessage
                      ? "bg-contact cursor-pointer border-none text-black"
                      : "border-contact/50 cursor-default border border-brand-o"
                  }`}
                >
                  {submitting
                    ? "SUBMITTING..."
                    : showSubmittedMessage
                      ? "FORM SUBMITTED ✓"
                      : "SEND MESSAGE →"}
                </button>
              </div>
            </form>
            <div className="flex w-full items-center justify-between text-[12px] uppercase">
              <div className="flex items-center gap-[2px]">
                <Link href="https://x.com/basementstudio" target="_blank">
                  <span className="">X (Twitter)</span>
                </Link>
                <span className="opacity-50">, </span>
                <Link
                  href="https://www.instagram.com/basementdotstudio"
                  target="_blank"
                >
                  <span className="">Instagram</span>
                </Link>
                <span className="opacity-50">, </span>
                <Link href="https://github.com/basementstudio" target="_blank">
                  <span className="">GitHub</span>
                </Link>
              </div>
              <Link href="mailto:hello@basement.studio">
                <span className="">(hello@basement.studio)</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ContactScreen
