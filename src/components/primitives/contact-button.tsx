import { useRouter } from "next/navigation"
import { useContactStore } from "../contact/contact-store"
import { useWebgl } from "@/hooks/use-webgl"
import { useCallback, useRef } from "react"

export const ContactButton = ({ children }: { children: React.ReactNode }) => {
  const setIsContactOpen = useContactStore((state) => state.setIsContactOpen)
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const isAnimating = useContactStore((state) => state.isAnimating)
  const router = useRouter()
  const webglEnabled = useWebgl()
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleClick = useCallback(() => {
    if (clickTimeoutRef.current || isAnimating) return

    if (webglEnabled) {
      setIsContactOpen(!isContactOpen)

      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null
      }, 1000)
    } else {
      router.push("/contact")
    }
  }, [webglEnabled, isContactOpen, setIsContactOpen, router, isAnimating])

  return <button onClick={handleClick}>{children}</button>
}
