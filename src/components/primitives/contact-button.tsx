import { useRouter } from "next/navigation"
import { useContactStore } from "../contact/contact-store"
import { useWebgl } from "@/hooks/use-webgl"

export const ContactButton = ({ children }: { children: React.ReactNode }) => {
  const setIsContactOpen = useContactStore((state) => state.setIsContactOpen)
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const router = useRouter()
  const webglEnabled = useWebgl()

  const handleClick = () => {
    if (webglEnabled) {
      setIsContactOpen(!isContactOpen)
    } else {
      router.push("/contact")
    }
  }

  return <button onClick={handleClick}>{children}</button>
}
