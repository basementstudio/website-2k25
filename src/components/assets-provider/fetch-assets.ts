import { cache } from "react"

import type { PortableTextBlock } from "@/service/sanity/types"

import { fetchAssetsLocal } from "./fetch-assets-local"
import { fetchAssetsSanity } from "./fetch-assets-sanity"

const ASSETS_SOURCE_SANITY = "sanity"

export interface AssetsResult {
  officeItems: string
  office: string
  officeWireframe: string
  outdoor: string
  godrays: string
  basketball: string
  basketballNet: string
  contactPhone: string
  specialEvents: {
    christmas: {
      tree: string
      song: string
    }
  }
  routingElements: string
  bakes: {
    title: string
    lightmap: string
    ambientOcclusion: string
    meshes: string[]
  }[]
  matcaps: {
    mesh: string
    file: string
    isGlass: boolean
  }[]
  glassMaterials: string[]
  doubleSideElements: string[]
  arcade: {
    idleScreen: string
    placeholderLab: string
    boot: string
    chronicles: string
    looper: string
    palm: string
    skybox: string
    cityscape: string
    introScreen: string
  }
  glassReflexes: {
    mesh: string
    url: string
  }[]
  inspectables: {
    id: string
    _title: string
    specs: {
      _id: string
      _title: string
      value: string
    }[]
    description: PortableTextBlock[] | undefined
    mesh: string
    xOffset: number
    yOffset: number
    xRotationOffset: number
    sizeTarget: number
    scenes: string[]
    fx: string
  }[]
  videos: {
    mesh: string
    url: string
    intensity: number
  }[]
  sfx: {
    basketballTheme: string
    basketballSwoosh: string
    basketballNet: string
    basketballThump: string
    basketballBuzzer: string
    basketballStreak: string
    knobTurning: string
    antenna: string
    blog: {
      lockedDoor: string[]
      door: {
        open: string
        close: string
      }[]
      lamp: {
        pull: string
        release: string
      }[]
    }
    arcade: {
      buttons: {
        press: string
        release: string
      }[]
      sticks: {
        press: string
        release: string
      }[]
      miamiHeatwave: string
    }
    music: {
      aqua: string
      rain: string
      tiger: string
      vhs: string
    }
    contact: {
      interference: string
    }
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
    postprocessing: {
      contrast: number
      brightness: number
      exposure: number
      gamma: number
      vignetteRadius: number
      vignetteSpread: number
      bloomStrength: number
      bloomRadius: number
      bloomThreshold: number
    }
  }[]
  outdoorCars: string
  characters: {
    model: string
    textureBody: string
    textureFaces: string
    textureArms: string
    textureComic: string
  }
  pets: {
    model: string
    pureTexture: string
    bostonTexture: string
  }
  lamp: {
    extraLightmap: string
  }
  // extra textures for things
  mapTextures: {
    rain: string
    basketballVa: string
  }
  physicsParams: {
    _title: string
    value: number
  }[]
}

export const fetchAssets = cache(async (): Promise<AssetsResult> => {
  if (process.env.ASSETS_SOURCE === ASSETS_SOURCE_SANITY) {
    return fetchAssetsSanity()
  }
  return fetchAssetsLocal()
})
