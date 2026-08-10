"use client"

import { useEffect } from "react"

import { useAssets } from "@/components/assets-provider"
import { useEditorStore } from "@/components/editor/editor-store"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import type { IScene } from "@/components/navigation-handler/navigation.interface"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

/**
 * Minimal stand-in for <NavigationHandler /> and <SetCanvasMode /> for the
 * Studio's "Editor" tool.
 *
 * The real handler derives the scene from `usePathname()`. This route's path
 * matches no scene name, so it would fall through to the "404" scene and render
 * the wireframe not-found material. So pin the scene explicitly and skip the
 * rest of the handler's job — tab focus order, Escape/Tab route navigation —
 * none of which means anything inside an iframe in the Studio.
 */
export const SceneBootstrap = ({ sceneName }: { sceneName: string }) => {
  const scenes = useAssets().scenes as IScene[]

  // Marks the canvas as editor-hosted: suppresses interactions in "edit" mode
  // and makes handleNavigation swap scenes instead of routing. Set in its own
  // effect so it lands before the scene effect below can trigger navigation.
  useEffect(() => {
    useEditorStore.getState().setIsEditor(true)
    return () => useEditorStore.getState().setIsEditor(false)
  }, [])

  useEffect(() => {
    if (!scenes.length) return

    const target =
      scenes.find((s) => s.name.toLowerCase() === sceneName.toLowerCase()) ??
      scenes[0]

    const { setScenes, setCurrentScene } = useNavigationStore.getState()
    setScenes(scenes)
    setCurrentScene(target)

    // Equivalent of <SetCanvasMode enabled /> in the (canvas) route group:
    // mount the Scene and make it visible.
    useAppLoadingStore.setState({ isCanvasInPage: true, canvasVisible: true })
  }, [scenes, sceneName])

  return null
}
