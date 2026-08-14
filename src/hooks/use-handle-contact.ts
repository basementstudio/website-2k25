import { useRouter } from "next/navigation"
import { useCallback, useRef } from "react"

import { useContactStore } from "@/components/contact/contact-store"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useWebgl } from "@/hooks/use-webgl"

export const useHandleContactButton = () => {
  const setIsContactOpen = useContactStore((state) => state.setIsContactOpen)
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const isAnimating = useContactStore((state) => state.isAnimating)
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)
  const canvasBootTimedOut = useAppLoadingStore(
    (state) => state.canvasBootTimedOut
  )
  const router = useRouter()
  const webglEnabled = useWebgl()
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleClick = useCallback(() => {
    if (clickTimeoutRef.current || isAnimating) return
    const isMobile = window.innerWidth < 1024
    const canUsePhone = webglEnabled && !isMobile && !canvasBootTimedOut

    if (canUsePhone) {
      // Still booting: wait for the scene rather than routing away from it.
      if (!canRunMainApp) return

      setIsContactOpen(!isContactOpen)

      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null
      }, 1000)
    } else {
      router.push("/contact")
    }
  }, [
    webglEnabled,
    isContactOpen,
    setIsContactOpen,
    router,
    isAnimating,
    canRunMainApp,
    canvasBootTimedOut
  ])

  return handleClick
}
