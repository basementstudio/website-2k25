"use client"
import { useCallback, useEffect } from "react"

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
  const { playSoundFX } = useSiteAudio()
  const scene = useCurrentScene()
  const isPeople = scene === "people"
  const isBlog = scene === "blog"
  const desiredVolume = isBlog ? 0.05 : 0.2

  useKeyPress(
    "Escape",
    useCallback(() => {
      setIsContactOpen(false)
    }, [])
  )

  useDisableScroll(isContactOpen)

  useEffect(() => {
    if (isPeople || isBlog) {
      if (isContactOpen) {
        playSoundFX("CONTACT_INTERFERENCE", desiredVolume)
      }
    }
  }, [isContactOpen, isPeople, isBlog, playSoundFX])

  return (
    <>
      <div className={cn("fixed inset-0 z-50 block")}>
        <ContactCanvas />
      </div>
      <div
        className={cn(
          "duration-600 pointer-events-none fixed inset-0 z-40 bg-black/90 transition-[backdrop-filter,opacity]",
          !isContactOpen ? "opacity-0" : "opacity-100"
        )}
      />
    </>
  )
}

export default Contact
