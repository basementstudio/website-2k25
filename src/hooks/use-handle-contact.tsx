import { useRouter } from "next/navigation"
import { useCallback, useRef } from "react"

import { useContactStore } from "@/components/contact/contact-store"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useWebgl } from "@/hooks/use-webgl"
import { useHandleNavigation } from "./use-handle-navigation"

export const useHandleContactButton = () => {
  const setIsContactOpen = useContactStore((state) => state.setIsContactOpen)
  const { handleNavigation } = useHandleNavigation()
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const isAnimating = useContactStore((state) => state.isAnimating)
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)
  const router = useRouter()
  const webglEnabled = useWebgl()
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleClick = useCallback(() => {
    if (clickTimeoutRef.current || isAnimating || !canRunMainApp) return
    const isMobile = window.innerWidth <= 768

    if (webglEnabled && !isMobile) {
      setIsContactOpen(!isContactOpen)

      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null
      }, 1000)
    } else {
      handleNavigation("/contact")
    }
  }, [
    webglEnabled,
    isContactOpen,
    setIsContactOpen,
    router,
    isAnimating,
    canRunMainApp
  ])

  return handleClick
}
