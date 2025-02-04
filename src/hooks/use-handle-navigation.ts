import { usePathname, useRouter } from "next/navigation"
import { useCallback } from "react"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { TRANSITION_DURATION } from "@/constants/transitions"

export const useHandleNavigation = () => {
  const router = useRouter()
  const pathname = usePathname()
  const setCurrentScene = useNavigationStore((state) => state.setCurrentScene)
  const setDisableCameraTransition = useNavigationStore(
    (state) => state.setDisableCameraTransition
  )
  const scenes = useNavigationStore((state) => state.scenes)

  const handleNavigation = useCallback(
    (route: string) => {
      if (route === pathname) return

      const selectedScene =
        route === "/"
          ? scenes?.find((scene) => scene.name.toLowerCase() === "home")
          : scenes?.find((scene) => scene.name === route.split("/")[1])

      if (!selectedScene) return

      if (window.scrollY < window.innerHeight) {
        window.scrollTo({ top: 0, behavior: "smooth" })
        setCurrentScene(selectedScene)

        // Wait for scroll to complete before routing
        const checkScroll = setInterval(() => {
          if (window.scrollY === 0) {
            clearInterval(checkScroll)
            router.push(route, { scroll: false })
          }
        }, 10)
      } else {
        document.documentElement.dataset.flip = "true"
        document.body.style.overflow = "hidden"
        setCurrentScene(selectedScene)
        setDisableCameraTransition(true)

        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "instant" })
          router.push(route, { scroll: false })

          setTimeout(() => {
            document.documentElement.dataset.flip = "false"
            document.body.style.overflow = "auto"
          }, 10)
        }, TRANSITION_DURATION)
      }
    },

    [router, setCurrentScene, scenes, pathname, setDisableCameraTransition]
  )

  return { handleNavigation }
}
