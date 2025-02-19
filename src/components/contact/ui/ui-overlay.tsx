import { useState } from "react"

import { submitContactForm } from "@/actions/contact-form"
import { cn } from "@/utils/cn"

import { useContactStore } from "../contact-store"

const UiOverlay = ({ className }: { className?: string }) => {
  const { formData, updateFormField } = useContactStore()
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
    }
  }

  return (
    <div className={cn("z-50", className)}>
      <div className="px-4 text-xs">
        <form onSubmit={handleSubmit} className="border border-gray-300 p-4">
          <div className="mb-4 flex gap-4">
            <input
              type="text"
              placeholder="NAME"
              value={formData.name}
              onChange={(e) => updateFormField("name", e.target.value)}
              className="w-1/2 bg-blue-50 p-2 focus:outline-none focus:ring-1 focus:ring-blue-200"
            />
            <input
              type="text"
              placeholder="COMPANY"
              value={formData.company}
              onChange={(e) => updateFormField("company", e.target.value)}
              className="w-1/2 bg-orange-50 p-2 focus:outline-none focus:ring-1 focus:ring-orange-200"
            />
          </div>

          <input
            type="email"
            placeholder="EMAIL"
            value={formData.email}
            onChange={(e) => updateFormField("email", e.target.value)}
            className="mb-4 w-full bg-green-50 p-2 focus:outline-none focus:ring-1 focus:ring-green-200"
          />

          <input
            type="text"
            placeholder="BUDGET (OPTIONAL)"
            value={formData.budget}
            onChange={(e) => updateFormField("budget", e.target.value)}
            className="mb-4 w-full bg-red-50 p-2 focus:outline-none focus:ring-1 focus:ring-red-200"
          />

          <textarea
            placeholder="MESSAGE"
            value={formData.message}
            onChange={(e) => updateFormField("message", e.target.value)}
            className="mb-1 h-12 w-full bg-purple-50 p-2 focus:outline-none focus:ring-1 focus:ring-purple-200"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-yellow-100 p-2 text-center hover:bg-yellow-200 disabled:opacity-50"
          >
            {submitting ? "SUBMITTING..." : "SUBMIT MESSAGE ->"}
          </button>

          <div className="mt-4 flex justify-between">
            <div className="flex gap-2">
              <a href="#" className="bg-green-100 px-4 hover:bg-green-200">
                TWITTER
              </a>
              <a href="#" className="bg-red-100 px-1 hover:bg-red-200">
                INSTAGRAM
              </a>
              ,
              <a href="#" className="bg-blue-100 px-1 hover:bg-blue-200">
                GITHUB
              </a>
            </div>
            <a href="#" className="bg-pink-100 px-1 hover:bg-pink-200">
              HELLO@BASEMENT.STUDIO
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UiOverlay
