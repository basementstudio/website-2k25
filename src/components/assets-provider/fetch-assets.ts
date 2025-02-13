import { basehub } from "basehub"

import { assetsQuery } from "./query"

export interface AssetsResult {
  office: string
  outdoor: string
  godrays: string
  basketball: string
  basketballNet: string
  contactPhone: string
  routingElements: string
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
      plusShapeScale: number
    }[]
  }[]
  characters: {
    model: string
    textureBody: string
    textureFaces: string
  }
  carGame: {
    body: string
    antenna: string
    wheel: string
  }
}

export async function fetchAssets(): Promise<AssetsResult> {
  const { threeDInteractions } = await basehub({
    next: { revalidate: 30 }
  }).query(assetsQuery)

  return {
    office: threeDInteractions.map.office?.file?.url ?? "",
    outdoor: threeDInteractions.map.outdoor?.file?.url ?? "",
    godrays: threeDInteractions.map.godrays?.file?.url ?? "",
    mapAssets: threeDInteractions.map.maps.items.map((item) => ({
      mesh: item._title,
      lightmap: item.lightmap?.url ?? "",
      lightmapIntensity: item.lightmapIntensity ?? 1,
      ambientOcclusion: item.ambientOcclusion?.url ?? "",
      ambientOcclusionIntensity: item.ambientOcclusionIntensity ?? 1
    })),
    routingElements: threeDInteractions.map.routingElements?.file?.url ?? "",
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
    contactPhone: threeDInteractions.contactPhone?.file?.url ?? "",
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
        tabClickableName: tab.tabClickableName ?? "",
        plusShapeScale: tab.plusShapeScale ?? 1
      }))
    })),
    characters: {
      model: threeDInteractions.characters.model.file?.url ?? "",
      textureBody: threeDInteractions.characters.textureBody?.url,
      textureFaces: threeDInteractions.characters.textureFaces?.url
    },
    carGame: {
      body: threeDInteractions.carGame.body?.file?.url ?? "",
      antenna: threeDInteractions.carGame.antena?.file?.url ?? "",
      wheel: threeDInteractions.carGame.wheel?.file?.url ?? ""
    }
  }
}
