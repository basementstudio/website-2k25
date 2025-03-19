"use client"
import { useCallback, useEffect, useRef } from "react"

import { useSiteAudio } from "@/hooks/use-site-audio"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useDisableScroll } from "@/hooks/use-disable-scroll"
import { useKeyPress } from "@/hooks/use-key-press"
import { cn } from "@/utils/cn"

import ContactCanvas from "./contact-canvas"
import { useContactStore } from "./contact-store"

const Contact = () => {
  const setIsContactOpen = useContactStore((state) => state.setIsContactOpen)
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const isAnimating = useContactStore((state) => state.isAnimating)
  const setIsAnimating = useContactStore((state) => state.setIsAnimating)

  const { playSoundFX } = useSiteAudio()
  const scene = useCurrentScene()
  const isPeople = scene === "people"
  const isBlog = scene === "blog"
  const desiredVolume = isBlog ? 0.05 : 0.2
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => {
    if (!isAnimating) {
      setIsContactOpen(false)
    }
  }, [setIsContactOpen, isAnimating])

  useKeyPress(
    "Escape",
    useCallback(() => {
      handleClose()
    }, [handleClose])
  )

  useDisableScroll(isContactOpen)

  useEffect(() => {
    if (isPeople || isBlog) {
      if (isContactOpen) {
        playSoundFX("CONTACT_INTERFERENCE", desiredVolume)
      }
    }
  }, [isContactOpen, isPeople, isBlog, playSoundFX, desiredVolume])

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    const handleTransitionStart = () => {
      setIsAnimating(true)
    }

    const handleTransitionEnd = () => {
      if (!isAnimating) {
        setIsAnimating(false)
      }
    }

    overlay.addEventListener("transitionstart", handleTransitionStart)
    overlay.addEventListener("transitionend", handleTransitionEnd)

    return () => {
      overlay.removeEventListener("transitionstart", handleTransitionStart)
      overlay.removeEventListener("transitionend", handleTransitionEnd)
    }
  }, [setIsAnimating, isContactOpen])

  useEffect(() => {
    if (window.location.hash === "#contact" && !isContactOpen) {
      setIsContactOpen(true)
    }

    const handleHashChange = () => {
      const hasContactHash = window.location.hash === "#contact"
      if (hasContactHash !== isContactOpen) {
        setIsContactOpen(hasContactHash)
      }
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => {
      window.removeEventListener("hashchange", handleHashChange)
    }
  }, [isContactOpen, setIsContactOpen])

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50",
          isContactOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <ContactCanvas />
      </div>
      <div
        ref={overlayRef}
        className={cn(
          "pointer-events-none fixed inset-0 z-40 bg-black/90 transition-all duration-300 ease-in-out",
          !isContactOpen ? "opacity-0" : "opacity-100"
        )}
      />
    </>
  )
}

export default Contact
