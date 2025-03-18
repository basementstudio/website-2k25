import { useRouter } from "next/navigation"
import { useContactStore } from "../contact/contact-store"

export const ContactButton = ({ children }: { children: React.ReactNode }) => {
  const setIsContactOpen = useContactStore((state) => state.setIsContactOpen)
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const router = useRouter()

  const handleClick = () => {
    // detect if user has webgl enabled
    if (window.WebGLRenderingContext) {
      setIsContactOpen(!isContactOpen)
    } else {
      router.push("/contact")
    }
  }

  return <button onClick={handleClick}>{children}</button>
}
