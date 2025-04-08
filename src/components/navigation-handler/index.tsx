"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"

import { useAssets } from "@/components/assets-provider"
import { useContactStore } from "@/components/contact/contact-store"
import { useInspectable } from "@/components/inspectables/context"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"
import { useKeyPress } from "@/hooks/use-key-press"
import { useArcadeStore } from "@/store/arcade-store"

import { IScene } from "./navigation.interface"
import { useNavigationStore } from "./navigation-store"

export const NavigationHandler = () => {
  const pathname = usePathname()
  const { setSelected } = useInspectable()
  const previousPathRef = useRef(pathname)

  const setScenes = useNavigationStore((state) => state.setScenes)
  const {
    isCanvasTabMode,
    setIsCanvasTabMode,
    currentScene,
    setCurrentScene,
    currentTabIndex,
    setEnteredByKeyboard
  } = useNavigationStore()
  const scenes: IScene[] = useAssets().scenes
  const { handleNavigation } = useHandleNavigation()
  const scene = useCurrentScene()
  const setLabTabIndex = useArcadeStore((state) => state.setLabTabIndex)
  const setIsSourceButtonSelected = useArcadeStore(
    (state) => state.setIsSourceButtonSelected
  )
  const isInGame = useArcadeStore((state) => state.isInGame)
  const { selected } = useInspectable()

  console.log("pathname", pathname)

  useEffect(() => setScenes(scenes), [scenes, setScenes])

  useEffect(() => {
    const handleContactFormNavigate = (event: CustomEvent) => {
      const path = event.detail?.path
      if (path) {
        handleNavigation(path)
      }
    }

    window.addEventListener(
      "contactFormNavigate",
      handleContactFormNavigate as EventListener
    )

    return () => {
      window.removeEventListener(
        "contactFormNavigate",
        handleContactFormNavigate as EventListener
      )
    }
  }, [handleNavigation])

  const setCurrentTabIndex = useNavigationStore(
    (state) => state.setCurrentTabIndex
  )

  useEffect(() => {
    if (!scenes.length || !pathname || previousPathRef.current === pathname) {
      previousPathRef.current = pathname
      return
    }

    const isFromPostToBlog =
      previousPathRef.current.startsWith("/post/") && pathname === "/blog"

    console.log("pathname", pathname)

    const expectedScene =
      pathname === "/" || pathname === "/index"
        ? scenes.find((scene) => scene.name.toLowerCase() === "home")
        : pathname.startsWith("/post/")
          ? scenes.find((scene) => scene.name === "blog")
          : scenes.find((scene) => scene.name === pathname.split("/")[1])

    if (
      expectedScene &&
      currentScene &&
      (expectedScene.name !== currentScene.name || isFromPostToBlog)
    ) {
      setCurrentScene(expectedScene)
    }

    previousPathRef.current = pathname
  }, [pathname, scenes, currentScene, setCurrentScene])

  useEffect(() => {
    if (!scenes.length) return

    setSelected(null)

    if (pathname === "/contact") {
      const expectedScene = scenes.find(
        (scene) => scene.name.toLowerCase() === "home"
      )
      if (expectedScene) {
        setCurrentScene(expectedScene)
      }
      return
    }

    const currentScene =
      pathname === "/" || pathname === "/index"
        ? scenes.find((scene) => scene.name.toLowerCase() === "home")
        : pathname.startsWith("/post/")
          ? scenes.find((scene) => scene.name === "blog")
          : scenes.find((scene) => scene.name === pathname.split("/")[1])

    if (!currentScene) {
      console.log("notFoundScene: currentScene", currentScene)
      const notFoundScene = scenes.find((scene) => scene.name === "404")
      if (notFoundScene) {
        setCurrentScene(notFoundScene)
      }
      return
    }

    if (currentScene.name !== scene) {
      setCurrentScene(currentScene)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, setSelected, setCurrentTabIndex])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !isCanvasTabMode) return

      if (!currentScene?.tabs?.length) {
        setIsCanvasTabMode(false)
        return
      }

      e.preventDefault()
      const isInLabTab = useArcadeStore.getState().isInLabTab
      const setIsInLabTab = useArcadeStore.getState().setIsInLabTab
      const labTabs = useArcadeStore.getState().labTabs
      const labTabIndex = useArcadeStore.getState().labTabIndex
      const isSourceButtonSelected =
        useArcadeStore.getState().isSourceButtonSelected

      if (pathname === "/lab") {
        if (!e.shiftKey) {
          if (currentTabIndex === 0 && !isInLabTab) {
            setIsInLabTab(true)
            setLabTabIndex(0)
            setCurrentTabIndex(-1)
            setIsSourceButtonSelected(false)
            return
          }

          if (isInLabTab) {
            if (labTabIndex === 0) {
              setLabTabIndex(1)
              setIsSourceButtonSelected(false)
              return
            }

            if (isSourceButtonSelected) {
              const nextIndex = labTabIndex + 1
              if (nextIndex < labTabs.length) {
                setLabTabIndex(nextIndex)
                setIsSourceButtonSelected(false)
                return
              }

              setIsInLabTab(false)
              setCurrentTabIndex(1)
              return
            } else {
              const currentTab = labTabs[labTabIndex]
              if (currentTab?.type === "experiment") {
                setIsSourceButtonSelected(true)
                return
              } else {
                const nextIndex = labTabIndex + 1
                if (nextIndex < labTabs.length) {
                  setLabTabIndex(nextIndex)
                  return
                }

                setIsInLabTab(false)
                setCurrentTabIndex(1)
                return
              }
            }
          }
        } else {
          if (isInLabTab) {
            if (isSourceButtonSelected) {
              setIsSourceButtonSelected(false)
              return
            } else {
              const prevIndex = labTabIndex - 1
              if (prevIndex >= 0) {
                const prevTab = labTabs[prevIndex]
                if (prevTab?.type === "experiment") {
                  setLabTabIndex(prevIndex)
                  setIsSourceButtonSelected(true)
                  return
                } else {
                  setLabTabIndex(prevIndex)
                  setIsSourceButtonSelected(false)
                  return
                }
              }

              setIsInLabTab(false)
              setCurrentTabIndex(0)
              return
            }
          } else if (currentTabIndex === 1) {
            setIsInLabTab(true)
            setLabTabIndex(labTabs.length - 1)
            setIsSourceButtonSelected(false)
            setCurrentTabIndex(-1)
            return
          }
        }
      }

      const newIndex = e.shiftKey ? currentTabIndex - 1 : currentTabIndex + 1

      if (newIndex < 0 || newIndex >= currentScene.tabs.length) {
        setIsCanvasTabMode(false)
        setIsInLabTab(false)

        setTimeout(() => {
          const tabEvent = new KeyboardEvent("keydown", {
            key: "Tab",
            bubbles: true,
            cancelable: true,
            shiftKey: e.shiftKey
          })
          document.dispatchEvent(tabEvent)
        }, 0)

        return
      }

      setCurrentTabIndex(newIndex)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isCanvasTabMode,
      setCurrentTabIndex,
      currentTabIndex,
      currentScene,
      setIsCanvasTabMode,
      pathname
    ]
  )

  useEffect(() => {
    if (pathname !== "/" && currentTabIndex !== -1) {
      setCurrentTabIndex(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCurrentTabIndex, pathname])

  useEffect(() => setSelected(null), [setSelected])

  useKeyPress("Tab", handleKeyDown)
  useKeyPress(
    "Escape",
    useCallback(() => {
      if (isInGame) return
      if (useContactStore.getState().isContactOpen) return
      if (selected) {
        setSelected(null)
        return
      }

      if (
        pathname === "/" ||
        pathname === "/index" ||
        !scenes ||
        window.scrollY > window.innerHeight
      )
        return

      const trimmedPathname = pathname.replace("/", "")
      const tabIndex = scenes[0].tabs.findIndex(
        (tab) => tab.tabName.toLowerCase() === trimmedPathname
      )

      if (
        scene === "services" ||
        scene === "blog" ||
        scene === "people" ||
        scene === "basketball" ||
        scene === "lab" ||
        scene === "showcase"
      ) {
        const enteredByKeyboard =
          useNavigationStore.getState().enteredByKeyboard
        handleNavigation("/")
        if (enteredByKeyboard) {
          setCurrentTabIndex(tabIndex)
        }
        setEnteredByKeyboard(false)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      scene,
      handleNavigation,
      pathname,
      scenes,
      setCurrentTabIndex,
      selected,
      isInGame
    ])
  )

  return null
}
