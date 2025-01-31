"use client"
import { useEffect } from "react"

import { useKeyPress } from "@/hooks/use-key-press"

import ContactCanvas from "./contact-canvas"
import { useContactStore } from "./contact-store"

const Contact = () => {
  const { setIsContactOpen, isContactOpen } = useContactStore()

  useKeyPress("Escape", () => setIsContactOpen(false))

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
