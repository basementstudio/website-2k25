import { basehub } from "basehub"

import { assetsQuery } from "./query"

export interface AssetsResult {
  map: string
  basketball: string
  basketballNet: string
  lightmaps: {
    mesh: string
    url: string
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
    scrollSpeed?: number
  }[]
  sfx: {
    basketballTheme: string
    basketballSwoosh: string
    basketballNet: string
    basketballThump: string
    basketballBuzzer: string
  }
}

export async function fetchAssets(): Promise<AssetsResult> {
  const { threeDInteractions } = await basehub({
    next: { revalidate: 30 }
  }).query(assetsQuery)

  return {
    map: threeDInteractions.map?.model?.file?.url ?? "",
    lightmaps: threeDInteractions.map.lightmaps.items.map((item) => ({
      mesh: item._title,
      url: item.exr.url
    })),
    arcade: {
      idleScreen: threeDInteractions.arcade.idleScreen?.url ?? ""
    },
    glassReflexes: threeDInteractions.map.glassReflexes.items.map((item) => ({
      mesh: item._title,
      url: item.file?.url ?? ""
    })),
    videos: threeDInteractions.map.videos.items.map((item) => ({
      mesh: item._title,
      url: item.file?.url ?? ""
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
        scrollSpeed: item.scrollSpeed ?? 1
      })
    )
  }
}
