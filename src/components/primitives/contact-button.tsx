import { useRouter } from "next/navigation"
import { useContactStore } from "../contact/contact-store"
import { useWebgl } from "@/hooks/use-webgl"
import { useCallback, useRef } from "react"
import { useAppLoadingStore } from "../loading/app-loading-handler"

export const ContactButton = ({ children }: { children: React.ReactNode }) => {
  const setIsContactOpen = useContactStore((state) => state.setIsContactOpen)
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const isAnimating = useContactStore((state) => state.isAnimating)
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)
  const router = useRouter()
  const webglEnabled = useWebgl()
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleClick = useCallback(() => {
    if (clickTimeoutRef.current || isAnimating || !canRunMainApp) return

    if (webglEnabled) {
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

  return <button onClick={handleClick}>{children}</button>
}
