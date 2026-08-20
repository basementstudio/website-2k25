import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"

import { useContactStore } from "@/components/contact/contact-store"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { TRANSITION_DURATION } from "@/constants/transitions"
import { useScrollTo } from "@/hooks/use-scroll-to"
import { useArcadeStore } from "@/store/arcade-store"

import { useScrollControl } from "./useScrollControl"

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

// Store values are read via getState() at call time instead of subscriptions:
// this hook is instantiated by every <Link> (~80 on /people), so each
// subscription here multiplies across the whole page.
export const useHandleNavigation = () => {
  const { disableScroll, enableScroll } = useScrollControl()
  const router = useRouter()
  const pathname = usePathname()
  const scrollToFn = useScrollTo()
  const scrollToRef = useRef(scrollToFn)

  useEffect(() => {
    scrollToRef.current = scrollToFn
  }, [scrollToFn])

  const getScene = useCallback((route: string) => {
    const { scenes } = useNavigationStore.getState()

    if (route === "/") {
      return scenes?.find((scene) => scene.name.toLowerCase() === "home")
    }

    const routeWithoutParams = route.split("?")[0].split("#")[0]
    const finalRoute = routeWithoutParams.split("/").filter(Boolean)[0]

    if (finalRoute === "careers") {
      return scenes?.find((scene) => scene.name === "people")
    }

    return scenes?.find((scene) => scene.name === finalRoute)
  }, [])

  const continueNavigation = useCallback(
    (route: string, fromMobileNav?: boolean) => {
      const selectedScene = getScene(route)

      if (!selectedScene) return

      const { setCurrentScene, setDisableCameraTransition } =
        useNavigationStore.getState()
      const canvasUnavailable = useAppLoadingStore.getState().canvasUnavailable

      if (window.scrollY < window.innerHeight && !fromMobileNav) {
        setCurrentScene(selectedScene)
        disableScroll()

        if (route !== "/lab") {
          useArcadeStore.getState().setIsInLabTab(false)
        }
        // Push before the cosmetic scroll: the route render is a React
        // transition, and serializing it behind the smooth-scroll animation
        // delayed the new page by the whole scroll duration.
        router.push(route, { scroll: false })

        scrollToRef.current({
          offset: 0,
          behavior: "smooth",
          callback: () => enableScroll()
        })
      } else {
        handleTransitionEffectOn(fromMobileNav || canvasUnavailable)
        disableScroll()
        setDisableCameraTransition(true)
        setCurrentScene(selectedScene)

        setTimeout(
          () => {
            if (route !== "/lab") {
              useArcadeStore.getState().setIsInLabTab(false)
            }
            router.push(route, { scroll: false })

            scrollToRef.current({
              offset: 0,
              behavior: "instant",
              callback: () => {
                handleTransitionEffectOff(fromMobileNav || canvasUnavailable)
                enableScroll()
              }
            })
          },
          window.innerWidth >= 1024 && !fromMobileNav ? TRANSITION_DURATION : 0
        )
      }
    },
    [router, disableScroll, enableScroll, getScene]
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
    [pathname, continueNavigation]
  )

  return { handleNavigation }
}
