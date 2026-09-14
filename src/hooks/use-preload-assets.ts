import { useEffect } from "react"
import { preload } from "react-dom"

import { AssetsResult } from "@/components/assets-provider/fetch-assets"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { entryAssetDependencies } from "@/lib/graphics/asset-dependencies"

export const usePreloadAssets = (assets: AssetsResult) => {
  const active = useAppLoadingStore((s) => s.isCanvasInPage)
  const loaderReady = useAppLoadingStore(
    (s) => s.hasLoaderFrame || s.loaderFailed
  )
  useEffect(() => {
    // Keep production's loader-first ordering, including speculative requests.
    if (!active || !loaderReady) return
    for (const url of [assets.office, assets.routingElements]) {
      preload(url, {
        as: "fetch",
        type: "model/gltf-binary",
        crossOrigin: "anonymous",
        fetchPriority: "high"
      })
    }
  }, [active, assets, loaderReady])
}

/** Mount with SceneContent so speculative assets cannot delay its JavaScript. */
export const usePreloadSceneAssets = (assets: AssetsResult) => {
  const scene = useNavigationStore((s) => s.currentScene?.name)
  useEffect(() => {
    // Resolve direct entry before selecting destination lighting.
    if (!scene) return
    const dependencies = entryAssetDependencies(assets, scene)
    // Map and ItemGroups start their model requests during this same mount.
    for (const url of dependencies.lightmaps)
      preload(url, {
        as: "fetch",
        crossOrigin: "anonymous",
        fetchPriority: "low"
      })
    for (const url of dependencies.images)
      preload(url, {
        as: "image",
        crossOrigin: "anonymous",
        fetchPriority: "low"
      })
  }, [assets, scene])
}
