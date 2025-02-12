import { useLenis } from "lenis/react"
import { usePathname, useRouter } from "next/navigation"
import { useCallback } from "react"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { TRANSITION_DURATION } from "@/constants/transitions"
import { useScrollTo } from "@/hooks/use-scroll-to"

export const useHandleNavigation = () => {
  const lenis = useLenis()
  const router = useRouter()
  const pathname = usePathname()
  const scrollTo = useScrollTo()
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
        setCurrentScene(selectedScene)
        lenis?.stop()

        scrollTo({
          offset: 0,
          behavior: "smooth",
          callback: () => {
            router.push(route, { scroll: false })
            lenis?.start()
          }
        })
      } else {
        document.documentElement.dataset.flip = "true"
        lenis?.stop()
        setDisableCameraTransition(true)
        setCurrentScene(selectedScene)

        setTimeout(() => {
          scrollTo({
            offset: 0,
            behavior: "instant",
            callback: () => {
              document.documentElement.dataset.flip = "false"
              lenis?.start()
            }
          })
          router.push(route, { scroll: false })
        }, TRANSITION_DURATION)
      }
    },

    [router, setCurrentScene, scenes, pathname, setDisableCameraTransition]
  )

  return { handleNavigation }
}
