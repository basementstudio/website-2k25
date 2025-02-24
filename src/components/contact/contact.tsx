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
          "fixed inset-0 z-50 transition-opacity duration-300 ease-in-out",
          isContactOpen
            ? "block opacity-100"
            : "pointer-events-none hidden opacity-0"
        )}
      >
        <ContactCanvas isContactOpen={isContactOpen} />
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 transition-[backdrop-filter,opacity] duration-1000 ease-in-out",
          isContactOpen && !isClosing
            ? "bg-black/60"
            : isClosing
              ? "pointer-events-none bg-black/60 opacity-0"
              : "pointer-events-none opacity-0"
        )}
      />
    </>
  )
}

export default Contact
