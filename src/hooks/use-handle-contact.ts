import { useRouter } from "next/navigation"
import { useCallback, useRef } from "react"

import { useContactStore } from "@/components/contact/contact-store"

import { useContactPhoneAvailability } from "./use-contact-phone-availability"

export const useHandleContactButton = () => {
  const setIsContactOpen = useContactStore((state) => state.setIsContactOpen)
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const isAnimating = useContactStore((state) => state.isAnimating)
  const { isSupported, canOpen } = useContactPhoneAvailability()
  const router = useRouter()
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleClick = useCallback(() => {
    if (clickTimeoutRef.current || isAnimating) return

    if (!isSupported) {
      router.push("/contact")
      return
    }

    // Still booting: wait for the scene rather than routing away from it.
    if (!canOpen) return

    setIsContactOpen(!isContactOpen)

    clickTimeoutRef.current = setTimeout(() => {
      clickTimeoutRef.current = null
    }, 1000)
  }, [
    isContactOpen,
    setIsContactOpen,
    router,
    isAnimating,
    isSupported,
    canOpen
  ])

  return handleClick
}
