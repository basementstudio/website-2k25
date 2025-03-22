import { useRouter } from "next/navigation"
import { useContactStore } from "@/components/contact/contact-store"
import { useWebgl } from "@/hooks/use-webgl"
import { useCallback, useRef } from "react"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"

export const useHandleContactButton = () => {
  const setIsContactOpen = useContactStore((state) => state.setIsContactOpen)
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
      router.push("/contact")
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
