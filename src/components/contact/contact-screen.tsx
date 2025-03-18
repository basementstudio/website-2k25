import { submitContactForm } from "@/actions/contact-form"
import { useEffect, useRef, useState } from "react"
import { motion, useAnimation } from "motion/react"
import { useContactStore } from "./contact-store"
import { SubmitHandler, useForm } from "react-hook-form"
import { Inputs } from "@/app/(pages)/contact/form/contact-form"

const ContactScreen = () => {
  // State
  const contentRef = useRef(null)
  const updatePositionRef = useRef<(() => void) | null>(null)
  const [screenPosition, setScreenPosition] = useState({ x: 0.5, y: 0.5, z: 0 })
  const animation = useAnimation()
  const worker = useContactStore((state) => state.worker)

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<Inputs>()

  // Watch the required fields
  const email = watch("email")
  const message = watch("message")

  // Check if required fields have values
  const isValid = !!email && !!message

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setSubmitting(true)
    setIsSubmitted(false)
    setSubmitError("")

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
        setIsSubmitted(true)
        setSubmitError("")
        reset()
      } else {
        setIsSubmitted(false)
        setSubmitError(result.error || "Form submission failed")
      }
    } catch (error) {
      setIsSubmitted(false)
      setSubmitError("Form submission failed")
    } finally {
      setSubmitting(false)
    }
  }

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
        className="relative flex h-[260px] w-[480px] bg-transparent"
        style={{
          transform: `perspective(400px) rotateY(0.5deg)`,
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
              onSubmit={handleSubmit(onSubmit)}
              className="relative flex h-full w-full flex-col justify-between gap-4 border border-brand-o pb-4 pt-6 uppercase"
            >
              <fieldset className="absolute -top-[10px] left-[10px]">
                <legend className="bg-black px-1">fill in the form</legend>
              </fieldset>

              <div className="grid grid-cols-2 gap-2 px-4">
                <input
                  type="text"
                  placeholder="NAME"
                  className="h-6 border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                  {...register("name")}
                />
                <input
                  type="text"
                  placeholder="COMPANY"
                  className="h-6 border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                  {...register("company")}
                />
                <input
                  required
                  type="email"
                  placeholder="EMAIL"
                  className="col-span-2 h-6 border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                  {...register("email", { required: "Email is required" })}
                />
                <input
                  type="text"
                  placeholder="BUDGET (OPTIONAL)"
                  className="col-span-2 h-6 border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                  {...register("budget")}
                />
                <textarea
                  required
                  placeholder="MESSAGE"
                  className="col-span-2 h-full resize-none border-b border-dashed border-brand-o bg-transparent p-1 placeholder:text-brand-o/50"
                  {...register("message", { required: "Message is required" })}
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
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ContactScreen
