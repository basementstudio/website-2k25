import { preload, PreloadAs, PreloadOptions } from "react-dom"
import { useEffect } from "react"

import { AssetsResult } from "@/components/assets-provider/fetch-assets"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"

// Assets that should not be preloaded
const ASSET_TO_NOT_PRELOAD = [
  "contactPhone",
  "inspectables",
  "glassMaterials",
  "doubleSideElements",
  "scenes",
  "sfx",
  "videos",
  "outdoorCars",
  "characters"
]

// Assets with their preload priority
const ASSET_PRIORITIES = {
  HIGH: ["bakes", "matcaps", "lamp"],
  MEDIUM: ["glassReflexes"],
  LOW: ["videos", "outdoorCars", "characters"]
} as const

// Assets has different keys for the url.
// This is a list of assets that have a different key for the url.
// Reduce recursive calls number by specifying the asset url key.
const ASSET_URL_SRC = [
  {
    key: "bakes",
    urlKey: ["lightmap", "ambientOcclusion"],
    priority: "HIGH"
  },
  {
    key: "characters",
    urlKey: "model",
    priority: "LOW"
  },
  {
    key: "glassReflexes",
    urlKey: "url",
    priority: "MEDIUM"
  },
  {
    key: "lamp",
    urlKey: "extraLightmap",
    priority: "HIGH"
  },
  {
    key: "matcaps",
    urlKey: "file",
    priority: "HIGH"
  },
  {
    key: "outdoorCars",
    urlKey: "model",
    priority: "LOW"
  },
  {
    key: "videos",
    urlKey: "url",
    priority: "LOW"
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
    case "jpg":
    case "jpeg":
    case "webp":
    case "avif":
      result = { as: "image", type: `image/${extension}` }
      break
    case "wav":
    case "mp3":
      result = { as: "audio", type: `audio/${extension}` }
      break
    case "mp4":
      result = { as: "video", type: "video/mp4" }
      break
    case "exr":
    case "glb":
    case "gltf":
      // For 3D models and special formats, use 'fetch' as the preload type
      result = { as: "fetch", type: undefined }
      break
    default:
      // Default to 'fetch' for unknown types
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
  urlSet = new Set<string>(),
  priority: keyof typeof ASSET_PRIORITIES = "HIGH"
) => {
  if (!obj) return urlSet
  if (ASSET_TO_NOT_PRELOAD.includes(currentKey ?? "")) return urlSet

  // Check if this asset should be preloaded based on priority
  const assetConfig = ASSET_URL_SRC.find(mapping => mapping.key === currentKey)
  if (assetConfig && assetConfig.priority !== priority) return urlSet

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
      obj.forEach((item) => collectUrls(item, undefined, urlSet, priority))
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
      collectUrls(value, key, urlSet, priority)
    })
  }

  return urlSet
}

// Main preload function
const preloadAllAssets = (obj: any) => {
  const timeouts: NodeJS.Timeout[] = []

  // Preload high priority assets first
  const highPriorityUrls = collectUrls(obj, undefined, new Set(), "HIGH")
  highPriorityUrls.forEach((url) => {
    const { as, type } = getAssetFormat(url)
    preload(url, { as, type })
  })

  // Preload medium priority assets after a delay
  timeouts.push(
    setTimeout(() => {
      const mediumPriorityUrls = collectUrls(obj, undefined, new Set(), "MEDIUM")
      mediumPriorityUrls.forEach((url) => {
        const { as, type } = getAssetFormat(url)
        preload(url, { as, type })
      })
    }, 1000)
  )

  // Preload low priority assets after a longer delay
  timeouts.push(
    setTimeout(() => {
      const lowPriorityUrls = collectUrls(obj, undefined, new Set(), "LOW")
      lowPriorityUrls.forEach((url) => {
        const { as, type } = getAssetFormat(url)
        preload(url, { as, type })
      })
    }, 2000)
  )

  return () => {
    // Cleanup function to clear timeouts
    timeouts.forEach(clearTimeout)
  }
}

export const usePreloadAssets = (assets: AssetsResult) => {
  const offscreenCanvasReady = useAppLoadingStore((s) => s.offscreenCanvasReady)

  useEffect(() => {
    if (offscreenCanvasReady) {
      const cleanup = preloadAllAssets(assets)
      return cleanup
    }
  }, [offscreenCanvasReady, assets])
}
