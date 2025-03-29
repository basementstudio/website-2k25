import { useLenis } from "lenis/react"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"

import { useContactStore } from "@/components/contact/contact-store"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { TRANSITION_DURATION } from "@/constants/transitions"
import { useScrollTo } from "@/hooks/use-scroll-to"
import { useArcadeStore } from "@/store/arcade-store"

const handleTransitionEffectOn = (fromMobileNav?: boolean) => {
  if (window.innerWidth >= 1024 && !fromMobileNav) {
    document.documentElement.dataset.disabled = "false"
    document.documentElement.dataset.flip = "true"
  }
}

const handleTransitionEffectOff = (fromMobileNav?: boolean) => {
  if (window.innerWidth >= 1024 && !fromMobileNav) {
    document.documentElement.dataset.flip = "false"
    setTimeout(() => {
      document.documentElement.dataset.disabled = "true"
    }, TRANSITION_DURATION)
  }
}

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

  const getScene = useCallback(
    (route: string) => {
      if (route === "/") {
        return scenes?.find((scene) => scene.name.toLowerCase() === "home")
      }

      const routeWithoutParams = route.split("?")[0].split("#")[0]
      const finalRoute = routeWithoutParams.split("/").filter(Boolean)[0]

      return scenes?.find((scene) => scene.name === finalRoute)
    },
    [scenes]
  )

  const handleNavigation = useCallback(
    (route: string, fromMobileNav?: boolean) => {
      if (route === pathname) return

      const isContactOpen = useContactStore.getState().isContactOpen
      const isContactAnimating = useContactStore.getState().isAnimating
      const isContactClosingCompleted =
        useContactStore.getState().closingCompleted

      if (isContactOpen || isContactAnimating || !isContactClosingCompleted) {
        const contactStore = useContactStore.getState()
        sessionStorage.setItem("pendingNavigation", route)
        contactStore.setIsContactOpen(false)

        const handleContactClosed = () => {
          if (contactStore.closingCompleted) {
            sessionStorage.removeItem("pendingNavigation")
            continueNavigation(route)
            document.removeEventListener("contactClosed", handleContactClosed)
          }
        }

        document.addEventListener("contactClosed", handleContactClosed)
        return
      }

      continueNavigation(route, fromMobileNav)
    },
    [pathname, setCurrentScene, scenes, setDisableCameraTransition]
  )

  const continueNavigation = useCallback(
    (route: string, fromMobileNav?: boolean) => {
      const selectedScene = getScene(route)

      if (!selectedScene) return

      if (window.scrollY < window.innerHeight && !fromMobileNav) {
        setCurrentScene(selectedScene)
        lenisRef.current?.stop()

        scrollToRef.current({
          offset: 0,
          behavior: "smooth",
          callback: () => {
            if (route !== "/lab") {
              useArcadeStore.getState().setIsInLabTab(false)
            }
            router.push(route, { scroll: false })
            lenisRef.current?.start()
          }
        })
      } else {
        handleTransitionEffectOn(fromMobileNav)
        lenisRef.current?.stop()
        setDisableCameraTransition(true)
        setCurrentScene(selectedScene)

        setTimeout(
          () => {
            scrollToRef.current({
              offset: 0,
              behavior: "instant",
              callback: () => {
                handleTransitionEffectOff(fromMobileNav)
                lenisRef.current?.start()
              }
            })
            if (route !== "/lab") {
              useArcadeStore.getState().setIsInLabTab(false)
            }
            router.push(route, { scroll: false })
          },
          window.innerWidth >= 1024 && !fromMobileNav ? TRANSITION_DURATION : 0
        )
      }
    },
    [router, setCurrentScene, scenes, setDisableCameraTransition, getScene]
  )

  return { handleNavigation }
}
