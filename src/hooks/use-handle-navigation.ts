import { useRouter } from "next/navigation"
import { useCallback } from "react"

export const useHandleNavigation = () => {
  const router = useRouter()

  const handleNavigation = useCallback(
    (route: string) => {
      // if is an slug page we need to do something else

      if (window.scrollY < window.innerHeight) {
        window.scrollTo({ top: 0, behavior: "smooth" })

        // Wait for scroll to complete before routing
        const checkScroll = setInterval(() => {
          if (window.scrollY === 0) {
            clearInterval(checkScroll)
            router.push(route, { scroll: false })
          }
        }, 10)
      } else {
        document.documentElement.dataset.flip = "true"
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "instant" })
          document.documentElement.dataset.flip = "false"
          router.push(route, { scroll: false })
        }, 250)

        // animate mask // probably need to disabel scroll
        // scroll to top roughly
        // route
      }
    },
    [router]
  )

  return { handleNavigation }
}
