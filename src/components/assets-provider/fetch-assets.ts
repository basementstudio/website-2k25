import { basehub } from "basehub"

import { assetsQuery } from "./query"

export interface AssetsResult {
  map: string
  basketball: string
  basketballNet: string
  mapAssets: {
    mesh: string
    lightmap: string
    lightmapIntensity: number
    ambientOcclusion: string
    ambientOcclusionIntensity: number
  }[]
  arcade: {
    idleScreen: string
  }
  glassReflexes: {
    mesh: string
    url: string
  }[]
  inspectables: {
    id: string
    url: string
  }[]
  videos: {
    mesh: string
    url: string
    intensity: number
  }[]
  cameraStates: {
    title: string
    position: {
      x: number
      y: number
      z: number
    }
    target: {
      x: number
      y: number
      z: number
    }
    fov?: number
    offsetMultiplier?: number
    targetScrollY?: number
  }[]
  sfx: {
    basketballTheme: string
    basketballSwoosh: string
    basketballNet: string
    basketballThump: string
    basketballBuzzer: string
  }
  clickables: {
    title: string
    route: string
    framePosition: [number, number, number]
    frameRotation: [number, number, number]
    frameSize: [number, number]
    hoverName: string
    arrowPosition: [number, number, number]
    arrowRotation: [number, number, number]
    arrowScale: number
  }[]
  scenes: {
    name: string
    cameraConfig: {
      position: [number, number, number]
      target: [number, number, number]
      fov: number
      targetScrollY: number
      offsetMultiplier: number
    }
    tabs: {
      tabName: string
      tabRoute: string
      tabHoverName: string
      tabClickableName: string
    }[]
  }[]
}

export async function fetchAssets(): Promise<AssetsResult> {
  const { threeDInteractions } = await basehub({
    next: { revalidate: 30 }
  }).query(assetsQuery)

  return {
    map: threeDInteractions.map?.model?.file?.url ?? "",
    mapAssets: threeDInteractions.map.maps.items.map((item) => ({
      mesh: item._title,
      lightmap: item.lightmap?.url ?? "",
      lightmapIntensity: item.lightmapIntensity ?? 1,
      ambientOcclusion: item.ambientOcclusion?.url ?? "",
      ambientOcclusionIntensity: item.ambientOcclusionIntensity ?? 1
    })),
    arcade: { idleScreen: threeDInteractions.arcade.idleScreen?.url ?? "" },
    glassReflexes: threeDInteractions.map.glassReflexes.items.map((item) => ({
      mesh: item._title,
      url: item.file?.url ?? ""
    })),
    videos: threeDInteractions.map.videos.items.map((item) => ({
      mesh: item._title,
      url: item.file?.url ?? "",
      intensity: item.intensity ?? 1
    })),
    inspectables: threeDInteractions.inspectables.inspectableList.items.map(
      (item) => ({
        id: item._id,
        url: item.model?.file?.url ?? ""
      })
    ),
    basketball: threeDInteractions.basketball.file?.url ?? "",
    basketballNet: threeDInteractions.basketballNet.file?.url ?? "",
    sfx: {
      basketballTheme: threeDInteractions.sfx.basketballTheme?.url ?? "",
      basketballSwoosh: threeDInteractions.sfx.basketballSwoosh?.url ?? "",
      basketballNet: threeDInteractions.sfx.basketballNet?.url ?? "",
      basketballThump: threeDInteractions.sfx.basketballThump?.url ?? "",
      basketballBuzzer: threeDInteractions.sfx.basketballBuzzer?.url ?? ""
    },
    cameraStates: threeDInteractions.cameraStates.cameraStates.items.map(
      (item) => ({
        title: item._title,
        fov: item.fov ?? 60,
        position: {
          x: item.posX ?? 0,
          y: item.posY ?? 0,
          z: item.posZ ?? 0
        },
        target: {
          x: item.tarX ?? 0,
          y: item.tarY ?? 0,
          z: item.tarZ ?? 0
        },
        offsetMultiplier: item.offsetMultiplier ?? 1,
        targetScrollY: item.targetScrollY ?? -1.5
      })
    ),
    clickables: threeDInteractions.clickables.clickables.items.map((item) => ({
      title: item._title,
      hoverName: item.hoverName ?? "",
      route: item.route ?? "",
      framePosition: [
        item.framePositionX ?? 0,
        item.framePositionY ?? 0,
        item.framePositionZ ?? 0
      ],
      frameRotation: [
        item.frameRotationX ?? 0,
        item.frameRotationY ?? 0,
        item.frameRotationZ ?? 0
      ],
      frameSize: [item.frameSizeX ?? 0, item.frameSizeY ?? 0],
      arrowPosition: [
        item.arrowPositionX ?? 0,
        item.arrowPositionY ?? 0,
        item.arrowPositionZ ?? 0
      ],
      arrowRotation: [
        item.arrowRotationX ?? 0,
        item.arrowRotationY ?? 0,
        item.arrowRotationZ ?? 0
      ],
      arrowScale: item.arrowScale ?? 0
    })),

    scenes: threeDInteractions.scenes.scenes.items.map((item) => ({
      name: item._title,
      cameraConfig: {
        position: [
          item.cameraConfig.posX ?? 0,
          item.cameraConfig.posY ?? 0,
          item.cameraConfig.posZ ?? 0
        ],
        target: [
          item.cameraConfig.tarX ?? 0,
          item.cameraConfig.tarY ?? 0,
          item.cameraConfig.tarZ ?? 0
        ],
        fov: item.cameraConfig.fov ?? 60,
        targetScrollY: item.cameraConfig.targetScrollY ?? -1.5,
        offsetMultiplier: item.cameraConfig.offsetMultiplier ?? 1
      },
      tabs: item.tabs.items.map((tab) => ({
        tabName: tab._title,
        tabRoute: tab.tabRoute ?? "",
        tabHoverName: tab.tabHoverName ?? "",
        tabClickableName: tab.tabClickableName ?? ""
      }))
    }))
  }
}
