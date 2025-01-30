"use client"
import { useKeyPress } from "@/hooks/use-key-press"
import { useCameraStore } from "@/store/app-store"

import ContactCanvas from "./contact-canvas"

const Contact = () => {
  const { isContactOpen, setContactOpen } = useCameraStore()

  useKeyPress("Escape", () => setContactOpen(false))

  return (
    <div className="fixed inset-0 z-50">
      {isContactOpen && <ContactCanvas />}
    </div>
  )
}

export default Contact
