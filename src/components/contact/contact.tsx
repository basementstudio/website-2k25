"use client"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect } from "react"

import { useDisableScroll } from "@/hooks/use-disable-scroll"
import { useKeyPress } from "@/hooks/use-key-press"

import ContactCanvas from "./contact-canvas"
import { useContactStore } from "./contact-store"

const Contact = () => {
  const { isContactOpen, setIsContactOpen } = useContactStore()

  useKeyPress(
    "Escape",
    useCallback(() => {
      if (isContactOpen) {
        setIsContactOpen(false)
      }
    }, [isContactOpen, setIsContactOpen])
  )

  useDisableScroll(isContactOpen)

  useEffect(() => {
    if (isContactOpen) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event("resize"))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isContactOpen])

  return (
    <>
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${
          isContactOpen
            ? "block opacity-100"
            : "pointer-events-none hidden opacity-0"
        }`}
      >
        <ContactCanvas isContactOpen={isContactOpen} />
      </div>

      <div
        className={`fixed inset-0 z-40 transition-[backdrop-filter,opacity] duration-1000 ease-in-out ${
          isContactOpen
            ? "opacity-100 backdrop-blur"
            : "pointer-events-none opacity-0"
        }`}
      />
    </>
  )
}

export default Contact
