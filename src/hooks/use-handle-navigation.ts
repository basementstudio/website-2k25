import { useLenis } from "lenis/react"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { TRANSITION_DURATION } from "@/constants/transitions"
import { useScrollTo } from "@/hooks/use-scroll-to"

export const useHandleNavigation = () => {
  const lenisInstance = useLenis()
  const lenisRef = useRef(lenisInstance)
  const router = useRouter()
  const pathname = usePathname()
  const scrollToFn = useScrollTo()
  const scrollToRef = useRef(scrollToFn)
  const setCurrentScene = useNavigationStore((state) => state.setCurrentScene)
  const setDisableCameraTransition = useNavigationStore(
    (state) => state.setDisableCameraTransition
  )
  const scenes = useNavigationStore((state) => state.scenes)

  useEffect(() => {
    lenisRef.current = lenisInstance
  }, [lenisInstance])

  useEffect(() => {
    scrollToRef.current = scrollToFn
  }, [scrollToFn])

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
        lenisRef.current?.stop()

        scrollToRef.current({
          offset: 0,
          behavior: "smooth",
          callback: () => {
            router.push(route, { scroll: false })
            lenisRef.current?.start()
          }
        })
      } else {
        document.documentElement.dataset.flip = "true"
        lenisRef.current?.stop()
        setDisableCameraTransition(true)
        setCurrentScene(selectedScene)

        setTimeout(() => {
          scrollToRef.current({
            offset: 0,
            behavior: "instant",
            callback: () => {
              document.documentElement.dataset.flip = "false"
              lenisRef.current?.start()
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
