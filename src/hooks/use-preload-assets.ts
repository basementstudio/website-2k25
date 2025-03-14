import { preload, PreloadAs, PreloadOptions } from "react-dom"

import { AssetsResult } from "@/components/assets-provider/fetch-assets"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"

const ASSET_TO_NOT_PRELOAD = [
  "contactPhone",
  "inspectables",
  "glassMaterials",
  "doubleSideElements",
  "scenes"
]
const ASSET_URL_SRC = [
  {
    key: "bakes",
    urlKey: "lightmap"
  },
  {
    key: "characters",
    urlKey: "model"
  },
  {
    key: "glassReflexes",
    urlKey: "url"
  },
  {
    key: "lamp",
    urlKey: "extraLightmap"
  },
  {
    key: "matcaps",
    urlKey: "file"
  },
  {
    key: "outdoorCars",
    urlKey: "model"
  },
  {
    key: "videos",
    urlKey: "url"
  }
]

const getAssetFormat = (
  url: string
): { as: PreloadOptions["as"]; type: PreloadOptions["type"] } => {
  const extension = url.split(".").pop()
  switch (extension) {
    case "png":
      return { as: "image", type: "image" }
    case "jpg":
      return { as: "image", type: "image" }
    case "jpeg":
      return { as: "image", type: "image" }
    case "webp":
      return { as: "image", type: "image" }
    case "glb":
      return { as: "fetch", type: "model" }
    case "mp3":
      return { as: "audio", type: "audio" }
    case "mp4":
      return { as: "video", type: "video" }
    case "exr":
      return { as: "fetch", type: "image/x-exr" }
    case "glb":
      return { as: "fetch", type: "model/gltf-binary" }
    default:
      return { as: "fetch", type: undefined }
  }
}

const preloadAllAssets = (obj: any, currentKey?: string) => {
  if (!obj) return
  if (ASSET_TO_NOT_PRELOAD.includes(currentKey ?? "")) return

  if (typeof obj === "string" && obj.startsWith("https://")) {
    const { as, type } = getAssetFormat(obj)
    preload(obj, { as, type })
  } else if (Array.isArray(obj)) {
    // Check if we have a specific URL key for this array
    const urlMapping = ASSET_URL_SRC.find(
      (mapping) => mapping.key === currentKey
    )

    if (urlMapping) {
      // This is a special array where each item has a specific URL key
      obj.forEach((item) => {
        if (item && typeof item === "object" && urlMapping.urlKey in item) {
          const url = item[urlMapping.urlKey]
          if (typeof url === "string" && url.startsWith("https://")) {
            const { as, type } = getAssetFormat(url)
            preload(url, { as, type })
          }
        }
      })
    } else {
      // Regular array, process each item recursively
      obj.forEach((item) => preloadAllAssets(item))
    }
  } else if (typeof obj === "object") {
    // Process each key-value pair in the object
    Object.entries(obj).forEach(([key, value]) => {
      preloadAllAssets(value, key)
    })
  }
}

export const usePreloadAssets = (assets: AssetsResult) => {
  const offscreenCanvasReady = useAppLoadingStore((s) => s.offscreenCanvasReady)
  if (offscreenCanvasReady) {
    preloadAllAssets(assets)
  }
}
