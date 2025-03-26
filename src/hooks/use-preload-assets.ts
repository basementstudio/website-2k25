import { preload, PreloadOptions } from "react-dom"

import { AssetsResult } from "@/components/assets-provider/fetch-assets"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"

// Assets that should not be preloaded
const ASSET_TO_NOT_PRELOAD = [
  "contactPhone",
  "inspectables",
  "glassMaterials",
  "doubleSideElements",
  "scenes",
  "sfx"
]

// Assets has different keys for the url.
// This is a list of assets that have a different key for the url.
// Reduce recursive calls number by specifying the asset url key.
const ASSET_URL_SRC = [
  {
    key: "bakes",
    urlKey: ["lightmap", "ambientOcclusion"]
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

// Memoization cache for assets url and format
const assetUrlCache = new Map<
  string,
  { as: PreloadOptions["as"]; type: PreloadOptions["type"] }
>()

const getAssetFormat = (
  url: string
): { as: PreloadOptions["as"]; type: PreloadOptions["type"] } => {
  // Return from cache if already computed
  if (assetUrlCache.has(url)) {
    return assetUrlCache.get(url)!
  }

  const extension = url.split(".").pop()?.toLowerCase() || ""
  let result: { as: PreloadOptions["as"]; type: PreloadOptions["type"] }

  switch (extension) {
    case "png":
      result = { as: "image", type: "image/png" }
      break
    case "jpg":
      result = { as: "image", type: "image/jpeg" }
      break
    case "jpeg":
      result = { as: "image", type: "image/jpeg" }
      break
    case "webp":
      result = { as: "image", type: "image/webp" }
      break
    case "avif":
      result = { as: "image", type: "image/avif" }
      break
    case "wav":
      result = { as: "audio", type: "audio/wav" }
      break
    case "mp3":
      result = { as: "audio", type: "audio/mpeg" }
      break
    case "mp4":
      result = { as: "video", type: "video/mp4" }
      break
    case "exr":
      result = { as: "fetch", type: "image/x-exr" }
      break
    case "glb":
      result = { as: "fetch", type: "model/gltf-binary" }
      break
    case "gltf":
      result = { as: "fetch", type: "model/gltf+json" }
      break
    default:
      result = { as: "fetch", type: undefined }
  }

  // Cache the result
  assetUrlCache.set(url, result)
  return result
}

// Function to collect all URLs from the assets object
const collectUrls = (
  obj: any,
  currentKey?: string,
  urlSet = new Set<string>()
) => {
  if (!obj) return urlSet
  if (ASSET_TO_NOT_PRELOAD.includes(currentKey ?? "")) return urlSet

  if (typeof obj === "string" && obj.startsWith("https://")) {
    urlSet.add(obj)
  } else if (Array.isArray(obj)) {
    // Check if we have a specific URL key for this array
    const urlMapping = ASSET_URL_SRC.find(
      (mapping) => mapping.key === currentKey
    )

    if (urlMapping) {
      // Extract URLs from special array items
      obj.forEach((item) => {
        if (!item || typeof item !== "object") return

        const urlKeys = Array.isArray(urlMapping.urlKey)
          ? urlMapping.urlKey
          : [urlMapping.urlKey]

        urlKeys.forEach((key) => {
          if (key in item) {
            const url = item[key]
            if (typeof url === "string" && url.startsWith("https://")) {
              urlSet.add(url)
            }
          }
        })
      })
    } else {
      // Process array items recursively
      obj.forEach((item) => collectUrls(item, undefined, urlSet))
    }
  } else if (typeof obj === "object") {
    // Collect direct URL values
    Object.values(obj).forEach((value) => {
      if (typeof value === "string" && value.startsWith("https://")) {
        urlSet.add(value)
      }
    })

    // Process nested object properties
    Object.entries(obj).forEach(([key, value]) => {
      collectUrls(value, key, urlSet)
    })
  }

  return urlSet
}

// Main preload function
const preloadAllAssets = (obj: any) => {
  // Step 1: Collect all unique URLs
  const urls = collectUrls(obj)

  // Preload all URLs
  urls.forEach((url) => {
    const { as, type } = getAssetFormat(url)
    preload(url, { as, type })
  })
}

export const usePreloadAssets = (assets: AssetsResult) => {
  const offscreenCanvasReady = useAppLoadingStore((s) => s.offscreenCanvasReady)

  if (offscreenCanvasReady) preloadAllAssets(assets)
}
