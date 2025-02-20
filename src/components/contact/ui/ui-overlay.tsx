import Link from "next/link"
import { useState } from "react"

import { submitContactForm } from "@/actions/contact-form"
import { cn } from "@/utils/cn"

import { useContactStore } from "../contact-store"

const UiOverlay = ({ className }: { className?: string }) => {
  const { formData, updateFormField, clearFormData, setFocusedElement } =
    useContactStore()
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

  const handleCursorPosition = (
    e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement
    setFocusedElement(target.id, target.selectionStart!)
  }

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
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormField("name", e.target.value)}
                onFocus={(e) => {
                  setFocusedElement("name", e.target.selectionStart || 0)
                }}
                onBlur={() => setFocusedElement(null)}
                onSelect={handleCursorPosition}
                onKeyUp={handleCursorPosition}
                onClick={handleCursorPosition}
                className="selec remove-focus-styles w-1/2 bg-transparent p-2 text-transparent"
              />
              <input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => updateFormField("company", e.target.value)}
                onFocus={(e) => {
                  setFocusedElement("company", e.target.selectionStart || 0)
                }}
                onBlur={() => setFocusedElement(null)}
                onSelect={handleCursorPosition}
                onKeyUp={handleCursorPosition}
                onClick={handleCursorPosition}
                className="remove-focus-styles w-1/2 bg-transparent p-2 text-transparent"
              />
            </div>

            <div className="flex flex-col gap-2">
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormField("email", e.target.value)}
                onFocus={(e) => {
                  setFocusedElement("email", e.target.selectionStart || 0)
                }}
                onBlur={() => setFocusedElement(null)}
                onSelect={handleCursorPosition}
                onKeyUp={handleCursorPosition}
                onClick={handleCursorPosition}
                className="remove-focus-styles mb-0 w-full bg-transparent p-2 text-transparent"
              />

              <input
                id="budget"
                type="text"
                value={formData.budget}
                onChange={(e) => updateFormField("budget", e.target.value)}
                onFocus={(e) => {
                  setFocusedElement("budget", e.target.selectionStart || 0)
                }}
                onBlur={() => setFocusedElement(null)}
                onSelect={handleCursorPosition}
                onKeyUp={handleCursorPosition}
                onClick={handleCursorPosition}
                className="remove-focus-styles -mt-0 mb-0 w-full bg-transparent p-2 text-transparent"
              />

              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => updateFormField("message", e.target.value)}
                onFocus={(e) => {
                  setFocusedElement("message", e.target.selectionStart || 0)
                }}
                onBlur={() => setFocusedElement(null)}
                onSelect={handleCursorPosition}
                onKeyUp={handleCursorPosition}
                onClick={handleCursorPosition}
                className="remove-focus-styles h-16 w-full resize-none bg-transparent p-2 text-start align-text-top text-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              onFocus={() => setFocusedElement("submit")}
              onBlur={() => setFocusedElement(null)}
              className="remove-focus-styles mt-6 w-full p-2 text-center text-transparent"
            >
              SUBMIT MESSAGE &gt;
            </button>

            <div className="mt-8 flex justify-between">
              <div className="flex gap-2">
                <Link
                  href="https://x.com/basementstudio"
                  target="_blank"
                  onFocus={() => setFocusedElement("twitter")}
                  onBlur={() => setFocusedElement(null)}
                  className="remove-focus-styles px-4 text-transparent"
                >
                  TWITTER
                </Link>
                <Link
                  href="https://www.instagram.com/basementdotstudio/"
                  target="_blank"
                  onFocus={() => setFocusedElement("instagram")}
                  onBlur={() => setFocusedElement(null)}
                  className="remove-focus-styles px-1 text-transparent"
                >
                  INSTAGRAM
                </Link>
                <Link
                  href="https://github.com/basementstudio"
                  target="_blank"
                  onFocus={() => setFocusedElement("github")}
                  onBlur={() => setFocusedElement(null)}
                  className="remove-focus-styles px-1 text-transparent"
                >
                  GITHUB
                </Link>
              </div>
              <a
                href="mailto:hello@basement.studio"
                onFocus={() => setFocusedElement("email")}
                onBlur={() => setFocusedElement(null)}
                className="remove-focus-styles px-1 text-transparent"
              >
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
