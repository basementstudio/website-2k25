import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { useCameraStore } from "@/store/app-store"

export const useHandleNavigation = () => {
  const router = useRouter()
  const updateCameraFromPathname = useCameraStore(
    (state) => state.updateCameraFromPathname
  )

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
          setTimeout(() => {
            document.documentElement.dataset.flip = "false"
            updateCameraFromPathname(route)
            router.push(route, { scroll: false })
          }, 5)
        }, 250)
      }
    },

    [router, updateCameraFromPathname]
  )

  return { handleNavigation }
}
