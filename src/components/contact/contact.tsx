"use client"
import { useEffect } from "react"

import { useKeyPress } from "@/hooks/use-key-press"
import { useCameraStore } from "@/store/app-store"

import ContactCanvas from "./contact-canvas"

const Contact = () => {
  const { setContactOpen } = useCameraStore()
  const { isContactOpen } = useCameraStore()

  useKeyPress("Escape", () => setContactOpen(false))

  useEffect(() => {
    if (isContactOpen) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event("resize"))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isContactOpen])

  return (
    <div
      className={`fixed inset-0 z-50 ${isContactOpen ? "visible" : "hidden"}`}
    >
      <ContactCanvas isContactOpen={isContactOpen} />
    </div>
  )
}

export default Contact
