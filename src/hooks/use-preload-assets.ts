import { preload, PreloadAs } from "react-dom"

import { AssetsResult } from "@/components/assets-provider/fetch-assets"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"

const ASSET_TO_NOT_PRELOAD = ["contactPhone"]

const getAssetFormat = (url: string): PreloadAs => {
  const extension = url.split(".").pop()
  switch (extension) {
    case "png":
      return "image"
    case "jpg":
      return "image"
    case "jpeg":
      return "image"
    case "webp":
      return "image"
    case "glb":
      return "fetch"
    case "mp3":
      return "audio"
    default:
      return "fetch"
  }
}

const preloadAllAssets = (obj: any) => {
  if (!obj) return
  if (ASSET_TO_NOT_PRELOAD.includes(obj.key)) return

  if (typeof obj === "string" && obj.startsWith("https://")) {
    preload(obj, { as: getAssetFormat(obj) as PreloadAs })
  } else if (Array.isArray(obj)) {
    obj.forEach((item) => preloadAllAssets(item))
  } else if (typeof obj === "object") {
    Object.values(obj).forEach((value) => preloadAllAssets(value))
  }
}

export const usePreloadAssets = (assets: AssetsResult) => {
  console.log("usePreloadAssets", assets)
  const offscreenCanvasReady = useAppLoadingStore((s) => s.offscreenCanvasReady)
  if (offscreenCanvasReady) {
    preloadAllAssets(assets)
  }
}
