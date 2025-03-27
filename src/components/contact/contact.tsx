"use client"

import { useCallback, useEffect, useRef } from "react"

import { useDeviceDetect } from "@/hooks/use-device-detect"
import { useDisableScroll } from "@/hooks/use-disable-scroll"
import { useKeyPress } from "@/hooks/use-key-press"
import { useMedia } from "@/hooks/use-media"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { cn } from "@/utils/cn"

import { ContactCanvas } from "./contact-canvas"
import { useContactStore } from "./contact-store"

const RenderContact = () => {
  const setIsContactOpen = useContactStore((state) => state.setIsContactOpen)
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const isAnimating = useContactStore((state) => state.isAnimating)
  const setIsAnimating = useContactStore((state) => state.setIsAnimating)
  const worker = useContactStore((state) => state.worker)

  const { playSoundFX } = useSiteAudio()

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
    if (!worker) return

    const handleWorkerMessage = (e: MessageEvent) => {
      const { type } = e.data

      if (type === "ruedita-animation-start") {
        setTimeout(() => {
          playSoundFX("CONTACT_KNOB_TURNING", 0.2)

          setTimeout(() => {
            playSoundFX("CONTACT_KNOB_TURNING", 0.2)
          }, 700)
        }, 700)
      } else if (type === "antena-animation-start") {
        setTimeout(() => {
          playSoundFX("CONTACT_ANTENNA", 0.2)
        }, 700)
      } else if (type === "button-animation-start") {
        setTimeout(() => {
          playSoundFX("ARCADE_BUTTON_0_PRESS", 0.4)
        }, 700)
      }
    }

    worker.addEventListener("message", handleWorkerMessage)
    return () => {
      worker.removeEventListener("message", handleWorkerMessage)
    }
  }, [worker, playSoundFX])

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

export const Contact = () => {
  const { isMobile } = useDeviceDetect()
  const isMobileWidth = useMedia("(max-width: 400px)")

  return isMobile || isMobileWidth ? null : <RenderContact />
}
