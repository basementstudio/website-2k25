"use client"
import { useCallback, useEffect } from "react"

import { useDisableScroll } from "@/hooks/use-disable-scroll"
import { useKeyPress } from "@/hooks/use-key-press"
import { cn } from "@/utils/cn"

import ContactCanvas from "./contact-canvas"
import { useContactStore } from "./contact-store"

const Contact = () => {
  const { isContactOpen, isClosing, setIsContactOpen } = useContactStore()

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
        className={cn(
          "fixed inset-0 z-50",
          isContactOpen ? "block" : "pointer-events-none hidden"
        )}
      >
        <ContactCanvas isContactOpen={isContactOpen} />
      </div>

      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-40 bg-black/90 transition-[backdrop-filter,opacity] duration-1000",
          !isContactOpen || isClosing ? "opacity-0" : "opacity-100"
        )}
      />
    </>
  )
}

export default Contact
