import { useState } from "react"

import { submitContactForm } from "@/actions/contact-form"
import { cn } from "@/utils/cn"

import { useContactStore } from "../contact-store"

const UiOverlay = ({ className }: { className?: string }) => {
  const { formData, updateFormField, clearFormData } = useContactStore()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const result = await submitContactForm(formData)
      if (!result.success) {
        console.error("Failed to submit form", result.error)
      }
    } catch (err) {
      console.error("An unexpected error occurred", err)
    } finally {
      setSubmitting(false)
      clearFormData()
    }
  }

  // focus:ring-1 focus:ring-brand-o ??

  return (
    <div className={cn(className)}>
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(4deg)"
        }}
      >
        <div className="ffflauta font-mono text-xs text-opacity-0">
          <form onSubmit={handleSubmit} className="px-4 py-4">
            <div className="mb-2 flex gap-4">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormField("name", e.target.value)}
                className="selec w-1/2 bg-transparent p-2 text-transparent focus:outline-none"
              />
              <input
                type="text"
                value={formData.company}
                onChange={(e) => updateFormField("company", e.target.value)}
                className="w-1/2 bg-transparent p-2 text-transparent focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateFormField("email", e.target.value)}
                className="mb-0 w-full bg-transparent p-2 text-transparent focus:outline-none"
              />

              <input
                type="text"
                value={formData.budget}
                onChange={(e) => updateFormField("budget", e.target.value)}
                className="-mt-0 mb-0 w-full bg-transparent p-2 text-transparent focus:outline-none"
              />

              <textarea
                value={formData.message}
                onChange={(e) => updateFormField("message", e.target.value)}
                className="mt-4 h-12 w-full resize-none bg-transparent p-2 tracking-[0.18em] text-transparent focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full p-2 text-center disabled:opacity-50"
            >
              {submitting ? "SUBMITTING..." : "SUBMIT MESSAGE ->"}
            </button>

            <div className="mt-8 flex justify-between">
              <div className="flex gap-2">
                <a href="#" className="px-4">
                  TWITTER
                </a>
                <a href="#" className="px-1">
                  INSTAGRAM
                </a>
                <a href="#" className="px-1">
                  GITHUB
                </a>
              </div>
              <a href="#" className="px-1">
                HELLO@BASEMENT.STUDIO
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UiOverlay
