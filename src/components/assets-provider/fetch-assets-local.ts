import { ASSETS_BASE, INSPECTABLES_META } from "@/lib/3d-config/asset-manifest"
import type { PortableTextBlock } from "@/service/sanity/types"

import type { AssetsResult } from "./fetch-assets"
import { fetchThreeDConfig } from "./fetch-3d-config-sanity"

// One log per missing inspectable per process — without dedup the warn loop
// would fire on every request × every missing inspectable, flooding log drains.
const warnedMissingInspectables = new Set<string>()

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

  return {
    ...ASSETS_BASE,
    inspectables,
    scenes,
    physicsParams
  }
}
