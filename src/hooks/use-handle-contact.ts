import { useRouter } from "next/navigation"
import { useCallback, useRef } from "react"

import { useContactStore } from "@/components/contact/contact-store"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"

import { useMedia } from "./use-media"

// Single source of truth for contact-phone eligibility. The Contact mount
// gate and the button handler must read the same values so the viewport
// and health gates cannot drift apart.
const useContactGateFlags = () => {
  const isDesktopWidth = useMedia("(min-width: 1024px)")
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)
  const canvasUnavailable = useAppLoadingStore(
    (state) => state.canvasUnavailable
  )
  const canvasBootTimedOut = useAppLoadingStore(
    (state) => state.canvasBootTimedOut
  )

  return {
    isDesktopWidth,
    canRunMainApp,
    canvasUnavailable,
    canvasBootTimedOut
  }
}

// Whether the phone overlay can actually be used right now.
export const useCanUseContactPhone = () => {
  const {
    isDesktopWidth,
    canRunMainApp,
    canvasUnavailable,
    canvasBootTimedOut
  } = useContactGateFlags()

  return (
    !!isDesktopWidth &&
    canRunMainApp &&
    !canvasUnavailable &&
    !canvasBootTimedOut
  )
}

export const useHandleContactButton = () => {
  const setIsContactOpen = useContactStore((state) => state.setIsContactOpen)
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const isAnimating = useContactStore((state) => state.isAnimating)
  const {
    isDesktopWidth,
    canRunMainApp,
    canvasUnavailable,
    canvasBootTimedOut
  } = useContactGateFlags()
  const router = useRouter()
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleClick = useCallback(() => {
    if (clickTimeoutRef.current || isAnimating) return

    const canRouteAway =
      !!isDesktopWidth && !canvasUnavailable && !canvasBootTimedOut

    if (!canRouteAway) {
      router.push("/contact")
      return
    }

    // Still booting: wait for the scene rather than routing away from it.
    if (!canRunMainApp) return

    setIsContactOpen(!isContactOpen)

    clickTimeoutRef.current = setTimeout(() => {
      clickTimeoutRef.current = null
    }, 1000)
  }, [
    isContactOpen,
    setIsContactOpen,
    router,
    isAnimating,
    isDesktopWidth,
    canRunMainApp,
    canvasUnavailable,
    canvasBootTimedOut
  ])

  return handleClick
}
