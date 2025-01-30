import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

export const useHandleNavigation = () => {
  const router = useRouter()
  const setCurrentScene = useNavigationStore((state) => state.setCurrentScene)
  const setStairVisibility = useNavigationStore.getState().setStairVisibility
  const scenes = useNavigationStore((state) => state.scenes)

  const handleNavigation = useCallback(
    (route: string) => {
      const selectedScene =
        route === "/"
          ? scenes?.find((scene) => scene.name.toLowerCase() === "home")
          : scenes?.find((scene) => scene.name === route.split("/")[1])

      if (!selectedScene) return

      setStairVisibility(selectedScene.name !== "")

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
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "instant" })
          setTimeout(() => {
            document.documentElement.dataset.flip = "false"
            setCurrentScene(selectedScene)
            router.push(route, { scroll: false })
          }, 5)
        }, 250)
      }
    },

    [router, setCurrentScene, scenes]
  )

  return { handleNavigation }
}
