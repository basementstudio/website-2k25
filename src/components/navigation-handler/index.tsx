"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect } from "react"

import { useCurrentScene } from "@/hooks/use-current-scene"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"
import { useKeyPress } from "@/hooks/use-key-press"

import { useAssets } from "../assets-provider"
import { useInspectable } from "../inspectables/context"
import { IScene } from "./navigation.interface"
import { useNavigationStore } from "./navigation-store"
import { useArcadeStore } from "@/store/arcade-store"

export const NavigationHandler = () => {
  const pathname = usePathname()
  const { setSelected } = useInspectable()

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

  useEffect(() => setScenes(scenes), [scenes, setScenes])

  const setCurrentTabIndex = useNavigationStore(
    (state) => state.setCurrentTabIndex
  )

  useEffect(() => setScenes(scenes), [scenes, setScenes])

  useEffect(() => {
    if (!scenes.length) return

    setSelected(null)

    const currentScene =
      pathname === "/"
        ? scenes.find((scene) => scene.name.toLowerCase() === "home")
        : scenes.find((scene) => scene.name === pathname.split("/")[1])

    if (currentScene && currentScene.name !== scene)
      setCurrentScene(currentScene)

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
          // handle enter labtabs
          if (currentTabIndex === 0 && !isInLabTab) {
            setIsInLabTab(true)
            setLabTabIndex(0)
            setCurrentTabIndex(-1)
            setIsSourceButtonSelected(false)
            return
          }

          // handle lab tab navigation
          if (isInLabTab) {
            if (labTabIndex === 0) {
              setLabTabIndex(1)
              setIsSourceButtonSelected(false)
              return
            }

            if (isSourceButtonSelected) {
              // move to next experiment or featured item
              const nextIndex = labTabIndex + 1
              if (nextIndex < labTabs.length) {
                setLabTabIndex(nextIndex)
                setIsSourceButtonSelected(false)
                return
              }
              // exit lab tabmode
              setIsInLabTab(false)
              setCurrentTabIndex(1)
              return
            } else {
              // check if current item is not a featured item
              const currentTab = labTabs[labTabIndex]
              if (currentTab?.type === "experiment") {
                setIsSourceButtonSelected(true)
                return
              } else {
                // if it's a featured item or button, move to next
                const nextIndex = labTabIndex + 1
                if (nextIndex < labTabs.length) {
                  setLabTabIndex(nextIndex)
                  return
                }
                // exit lab tabmode
                setIsInLabTab(false)
                setCurrentTabIndex(1)
                return
              }
            }
          }
        } else {
          // handle shift+tab
          if (isInLabTab) {
            if (isSourceButtonSelected) {
              // move back to experiment title
              setIsSourceButtonSelected(false)
              return
            } else {
              // move to previous experiment or close button
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
              // exit lab tab mode if we are at the start
              setIsInLabTab(false)
              setCurrentTabIndex(0)
              return
            }
          } else if (currentTabIndex === 1) {
            // when shift-tabbing from scene tab index 1 return to lab tabs
            setIsInLabTab(true)
            setLabTabIndex(labTabs.length - 1)
            setIsSourceButtonSelected(false)
            setCurrentTabIndex(-1)
            return
          }
        }
      }

      // regular tab navigation
      const newIndex = e.shiftKey ? currentTabIndex - 1 : currentTabIndex + 1

      if (newIndex < 0 || newIndex >= currentScene.tabs.length) {
        setIsCanvasTabMode(false)
        setIsInLabTab(false)
        return
      }

      setCurrentTabIndex(newIndex)

      if (
        (e.shiftKey && currentTabIndex === 0) ||
        (!e.shiftKey && currentTabIndex === currentScene.tabs.length - 1)
      ) {
        setIsCanvasTabMode(false)
        setIsInLabTab(false)
      }
    },
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
  }, [setCurrentTabIndex, pathname])

  useEffect(() => setSelected(null), [setSelected])

  useKeyPress("Tab", handleKeyDown)
  useKeyPress(
    "Escape",
    useCallback(() => {
      if (pathname === "/" || !scenes || window.scrollY > window.innerHeight)
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
    }, [scene, handleNavigation, pathname, scenes, setCurrentTabIndex])
  )

  return null
}
