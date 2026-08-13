import { ASSETS_BASE, INSPECTABLES_META } from "@/lib/3d-config/asset-manifest"
import type { PortableTextBlock } from "@/service/sanity/types"

import type { SanityMapAssetsConfig } from "./fetch-3d-config-sanity"
import {
  fetchThreeDConfig,
  fetchThreeDConfigDrafts
} from "./fetch-3d-config-sanity"
import type { AssetsResult } from "./fetch-assets"

// One log per missing inspectable per process — without dedup the warn loop
// would fire on every request × every missing inspectable, flooding log drains.
const warnedMissingInspectables = new Set<string>()

const pickUrl = (override: string | null | undefined, fallback: string) =>
  typeof override === "string" && override.length > 0 ? override : fallback

/**
 * Joins the repo manifest with Sanity content into one `AssetsResult`.
 *
 * `drafts` is for the Studio's Editor tool only — it saves to the draft, so it
 * has to preview the draft. Everything else reads published.
 */
export async function fetchAssetsLocal({
  perspective = "published"
}: { perspective?: "published" | "drafts" } = {}): Promise<AssetsResult> {
  const config =
    perspective === "drafts"
      ? await fetchThreeDConfigDrafts()
      : await fetchThreeDConfig()

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

  const meshOverrides = (map?.meshOverrides ?? []).flatMap((o) => {
    const { mesh, x, y, z, hidden, replacement } = o
    if (!mesh) {
      console.warn(
        `[3d-config] skipping mesh override with no mesh name ${JSON.stringify(o)}`
      )
      return []
    }

    const hasPosition = [x, y, z].every((n) => typeof n === "number")
    if (!hasPosition && [x, y, z].some((n) => typeof n === "number")) {
      console.warn(
        `[3d-config] mesh override "${mesh}" has a partial position; ignoring the move.`
      )
    }

    const r = replacement
    const hasReplacement =
      !!r?.assetId &&
      !!r?.url &&
      [r.x, r.y, r.z].every((n) => typeof n === "number")
    if (r && !hasReplacement) {
      console.warn(
        `[3d-config] mesh override "${mesh}" has an incomplete replacement; ignoring it.`
      )
    }

    const entry = {
      mesh,
      position: hasPosition
        ? ([x, y, z] as [number, number, number])
        : (null as [number, number, number] | null),
      hidden: hidden === true,
      replacement: hasReplacement
        ? {
            assetId: r.assetId as string,
            url: r.url as string,
            position: [r.x, r.y, r.z] as [number, number, number]
          }
        : null
    }

    if (!entry.position && !entry.hidden && !entry.replacement) return []
    return [entry]
  })

  return {
    ...ASSETS_BASE,
    mapTextures: {
      rain: pickUrl(map?.mapTextures?.rain, ASSETS_BASE.mapTextures.rain),
      basketballVa: pickUrl(
        map?.mapTextures?.basketballVa,
        ASSETS_BASE.mapTextures.basketballVa
      )
    },

    inspectables,
    scenes,
    physicsParams,
    meshOverrides
  }
}
