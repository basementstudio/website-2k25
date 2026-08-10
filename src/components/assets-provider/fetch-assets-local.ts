import {
  ASSETS_BASE,
  INSPECTABLES_META,
  MAP_MODEL_KEYS,
  type MapModelKey
} from "@/lib/3d-config/asset-manifest"
import type { PortableTextBlock } from "@/service/sanity/types"

import type { SanityMapAssetsConfig } from "./fetch-3d-config-sanity"
import { fetchThreeDConfig } from "./fetch-3d-config-sanity"
import type { AssetsResult } from "./fetch-assets"

// One log per missing inspectable per process — without dedup the warn loop
// would fire on every request × every missing inspectable, flooding log drains.
const warnedMissingInspectables = new Set<string>()

const pickUrl = (override: string | null | undefined, fallback: string) =>
  typeof override === "string" && override.length > 0 ? override : fallback

function resolveMapModels(
  map: SanityMapAssetsConfig | null
): Record<MapModelKey, string> {
  const resolved = {} as Record<MapModelKey, string>
  const missing: MapModelKey[] = []

  for (const key of MAP_MODEL_KEYS) {
    const url = map?.[key]
    if (typeof url === "string" && url.length > 0) resolved[key] = url
    else missing.push(key)
  }

  if (missing.length > 0) {
    throw new Error(
      `[3d-config] mapAssetsConfig is missing ${missing.length} required map model(s): ${missing.join(", ")}. ` +
        `These have no local fallback. Fix in Sanity Studio → 3D Config → Map Assets: upload a .glb for each, then publish. ` +
        (map === null
          ? "The mapAssetsConfig document is not published at all."
          : "The document is published but those fields are empty.")
    )
  }

  return resolved
}

/** Joins the repo manifest with Sanity content into one `AssetsResult`. */
export async function fetchAssetsLocal(): Promise<AssetsResult> {
  const config = await fetchThreeDConfig()

  const inspectableContentById = new Map(
    (config.inspectables ?? []).map((c) => [c.inspectableId ?? "", c])
  )

  const inspectables = INSPECTABLES_META.map((meta) => {
    const content = inspectableContentById.get(meta.id)
    if (!content && !warnedMissingInspectables.has(meta.id)) {
      warnedMissingInspectables.add(meta.id)
      console.warn(
        `[3d-config] no Sanity inspectableContent for id="${meta.id}"; rendering with empty copy.`
      )
    }
    return {
      id: meta.id,
      _title: content?.title ?? "",
      specs: (content?.specs ?? []).map((s) => ({
        _id: s.specId ?? "",
        _title: s.title ?? "",
        value: s.value ?? ""
      })),
      description: Array.isArray(content?.description)
        ? (content.description as PortableTextBlock[])
        : undefined,
      mesh: meta.mesh,
      xOffset: meta.xOffset,
      yOffset: meta.yOffset,
      xRotationOffset: meta.xRotationOffset,
      sizeTarget: meta.sizeTarget,
      scenes: [...meta.scenes],
      fx: meta.fx
    }
  })

  const scenes = (config.scenes ?? []).map((s) => ({
    name: s.sceneName ?? "",
    cameraConfig: {
      position: [
        s.cameraConfig?.posX ?? 0,
        s.cameraConfig?.posY ?? 0,
        s.cameraConfig?.posZ ?? 0
      ] as [number, number, number],
      target: [
        s.cameraConfig?.tarX ?? 0,
        s.cameraConfig?.tarY ?? 0,
        s.cameraConfig?.tarZ ?? 0
      ] as [number, number, number],
      fov: s.cameraConfig?.fov ?? 60,
      targetScrollY: s.cameraConfig?.targetScrollY ?? -1.5,
      offsetMultiplier: s.cameraConfig?.offsetMultiplier ?? 1
    },
    tabs: (s.tabs ?? []).map((tab) => ({
      tabName: tab.tabName ?? "",
      tabRoute: tab.tabRoute ?? "",
      tabHoverName: tab.tabHoverName ?? "",
      tabClickableName: tab.tabClickableName ?? "",
      plusShapeScale: tab.plusShapeScale ?? 1
    })),
    postprocessing: {
      contrast: s.postprocessing?.contrast ?? 1,
      brightness: s.postprocessing?.brightness ?? 1,
      exposure: s.postprocessing?.exposure ?? 1,
      gamma: s.postprocessing?.gamma ?? 1,
      vignetteRadius: s.postprocessing?.vignetteRadius ?? 1,
      vignetteSpread: s.postprocessing?.vignetteSpread ?? 1,
      bloomStrength: s.postprocessing?.bloomStrength ?? 1,
      bloomRadius: s.postprocessing?.bloomRadius ?? 1,
      bloomThreshold: s.postprocessing?.bloomThreshold ?? 1
    }
  }))

  const physicsParams = (config.physics?.physicsParams ?? []).map((p) => ({
    _title: p.title ?? "",
    value: p.value ?? 0
  }))

  const map = config.mapAssets

  return {
    ...ASSETS_BASE,
    ...resolveMapModels(map),
    mapTextures: {
      rain: pickUrl(map?.mapTextures?.rain, ASSETS_BASE.mapTextures.rain),
      basketballVa: pickUrl(
        map?.mapTextures?.basketballVa,
        ASSETS_BASE.mapTextures.basketballVa
      )
    },

    inspectables,
    scenes,
    physicsParams
  }
}
