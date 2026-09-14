"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect } from "react"

import { useDeviceDetect } from "@/hooks/use-device-detect"
import { useDisableScroll } from "@/hooks/use-disable-scroll"
import { useKeyPress } from "@/hooks/use-key-press"
import { useMedia } from "@/hooks/use-media"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { cn } from "@/utils/cn"

import type { ContactEvent } from "./contact-controller"
import { useContactStore } from "./contact-store"
const ContactCanvas = dynamic(
  () => import("./contact-canvas").then((m) => m.ContactCanvas),
  { ssr: false }
)

const RenderContact = () => {
  const setIsContactOpen = useContactStore((state) => state.setIsContactOpen)
  const hasBeenOpened = useContactStore((s) => s.hasBeenOpenedBefore)
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const isAnimating = useContactStore((state) => state.isAnimating)
  const controller = useContactStore((state) => state.controller)

  const { playSoundFX } = useSiteAudio()

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
    if (!controller) return

    const handleWorkerMessage = (e: ContactEvent) => {
      const { type } = e

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

    return controller.events.subscribe(handleWorkerMessage)
  }, [controller, playSoundFX])

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50",
          isContactOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {hasBeenOpened && <ContactCanvas />}
      </div>
      <div
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
