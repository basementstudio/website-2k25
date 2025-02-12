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
    placeholderLab: string
    boot: string
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
  fogStates: {
    title: string
    fogColor: {
      r: number
      g: number
      b: number
    }
    fogDensity: number
    fogDepth: number
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
  car: {
    carModel: string
    textures: {
      dodgeOTexture: string
      dodgeBTexture: string
      deloreanTexture: string
      nissanTexture: string
      simpsonsTexture: string
      knightRiderTexture: string
      misteryTexture: string
    }
  }
  characters: {
    model: string
    textureBody: string
    textureFaces: string
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
    arcade: {
      idleScreen: threeDInteractions.arcade.idleScreen?.url ?? "",
      placeholderLab: threeDInteractions.arcade.placeholderLab?.url ?? "",
      boot: threeDInteractions.arcade.boot?.url ?? ""
    },
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
    car: {
      carModel: threeDInteractions.car.carModel?.url ?? "",
      textures: {
        dodgeOTexture: threeDInteractions.car.dodgeOTexture?.url ?? "",
        dodgeBTexture: threeDInteractions.car.dodgeBTexture?.url ?? "",
        deloreanTexture: threeDInteractions.car.deloreanTexture?.url ?? "",
        nissanTexture: threeDInteractions.car.nissanTexture?.url ?? "",
        simpsonsTexture: threeDInteractions.car.simpsonsTexture?.url ?? "",
        knightRiderTexture:
          threeDInteractions.car.knightRiderTexture?.url ?? "",
        misteryTexture: threeDInteractions.car.misteryTexture?.url ?? ""
      }
    },
    fogStates: threeDInteractions.fogStates.fogStates.items.map((item) => ({
      title: item._title,
      fogColor: {
        r: item.fogColorR ?? 0,
        g: item.fogColorG ?? 0,
        b: item.fogColorB ?? 0
      },
      fogDensity: item.fogDensity ?? 0,
      fogDepth: item.fogDepth ?? 0
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
        tabClickableName: tab.tabClickableName ?? "",
        plusShapeScale: tab.plusShapeScale ?? 1
      }))
    })),
    characters: {
      model: threeDInteractions.characters.model.file?.url ?? "",
      textureBody: threeDInteractions.characters.textureBody?.url,
      textureFaces: threeDInteractions.characters.textureFaces?.url
    }
  }
}
