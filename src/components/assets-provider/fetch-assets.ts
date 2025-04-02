import { client } from "@/service/basehub"

import { assetsQuery } from "./query"

export interface AssetsResult {
  officeItems: string
  office: string
  officeWireframe: string
  outdoor: string
  godrays: string
  basketball: string
  basketballNet: string
  contactPhone: string
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
    description: any
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

export async function fetchAssets(): Promise<AssetsResult> {
  const { threeDInteractions, pages } = await client().query(assetsQuery)

  return {
    officeItems: threeDInteractions.map.officeItems.file.url,
    office: threeDInteractions.map.office.file.url,
    officeWireframe: threeDInteractions.map.wireframeModel.file.url,
    mapTextures: {
      rain: threeDInteractions.map.textures.rain.url,
      basketballVa: threeDInteractions.map.textures.basketballVa.url
    },
    outdoor: threeDInteractions.map.outdoor.file.url,
    godrays: threeDInteractions.map.godrays.file.url,
    bakes: threeDInteractions.map.bakes.items.map((item) => ({
      title: item._title,
      lightmap: item.lightmap?.url ?? "",
      ambientOcclusion: item.ambientOcclusion?.url ?? "",
      meshes: item.meshes.items.map((mesh) => mesh._title)
    })),
    glassReflexes: threeDInteractions.map.glassReflexes.items.map((item) => ({
      mesh: item._title,
      url: item.file?.url ?? ""
    })),
    matcaps: threeDInteractions.map.matcaps.items.map((item) => ({
      mesh: item._title,
      file: item.file?.url ?? "",
      isGlass: item.isGlass ?? false
    })),
    routingElements: threeDInteractions.map.routingElements?.file?.url ?? "",
    glassMaterials: threeDInteractions.map.glassMaterials.items.map(
      (item) => item._title
    ),
    doubleSideElements: threeDInteractions.map.doubleSideElements.items.map(
      (item) => item._title
    ),
    arcade: {
      idleScreen: threeDInteractions.arcade.idleScreen?.url ?? "",
      placeholderLab: threeDInteractions.arcade.placeholderLab?.url ?? "",
      boot: threeDInteractions.arcade.boot?.url ?? "",
      chronicles: threeDInteractions.arcade.chronicles?.url ?? "",
      looper: threeDInteractions.arcade.looper?.url ?? "",
      palm: threeDInteractions.arcade.palm.url,
      skybox: threeDInteractions.arcade.sky.url,
      cityscape: threeDInteractions.arcade.cityscape.url,
      introScreen: threeDInteractions.arcade.introScreen?.url
    },
    videos: threeDInteractions.map.videos.items.map((item) => ({
      mesh: item._title,
      url: item.file?.url ?? "",
      intensity: item.intensity ?? 1
    })),
    inspectables: pages.inspectables.inspectableList.items.map((item) => ({
      id: item._id ?? "",
      _title: item._title ?? "",
      specs: item.specs.items.map((item) => ({
        _id: item._id,
        _title: item._title,
        value: item.value ?? ""
      })),
      description: item.description,
      mesh: item.mesh ?? "",
      xOffset: item.xOffset ?? 0,
      yOffset: item.yOffset ?? 0,
      xRotationOffset: item.xRotationOffset ?? 0,
      sizeTarget: item.sizeTarget ?? 0,
      scenes: item.scenes?.map((item) => item._title) ?? [],
      fx: item.fx?.url ?? ""
    })),
    basketball: threeDInteractions.basketball.file?.url ?? "",
    basketballNet: threeDInteractions.basketballNet.file?.url ?? "",
    contactPhone: threeDInteractions.contactPhone?.file?.url ?? "",
    sfx: {
      basketballTheme: threeDInteractions.sfx.basketballTheme?.url,
      basketballSwoosh: threeDInteractions.sfx.basketballSwoosh?.url,
      basketballNet: threeDInteractions.sfx.basketballNet?.url,
      basketballThump: threeDInteractions.sfx.basketballThump?.url,
      basketballBuzzer: threeDInteractions.sfx.basketballBuzzer?.url,
      basketballStreak: threeDInteractions.sfx.basketballStreak?.url,
      knobTurning: threeDInteractions.sfx.knobTurning?.url ?? "",
      antenna: threeDInteractions.sfx.antenna?.url ?? "",
      blog: {
        lockedDoor: threeDInteractions.sfx.blog.lockedDoor.items.map(
          (item) => item.sound?.url ?? ""
        ),
        door: threeDInteractions.sfx.blog.door.items.map((item) => ({
          open: item.open?.url ?? "",
          close: item.close?.url ?? ""
        })),
        lamp: threeDInteractions.sfx.blog.lamp.items.map((item) => ({
          pull: item.pull?.url ?? "",
          release: item.release?.url ?? ""
        }))
      },
      arcade: {
        buttons: threeDInteractions.sfx.arcade.buttons.items.map((item) => ({
          press: item.press?.url ?? "",
          release: item.release?.url ?? ""
        })),
        sticks: threeDInteractions.sfx.arcade.sticks.items.map((item) => ({
          press: item.press?.url ?? "",
          release: item.release?.url ?? ""
        })),
        miamiHeatwave: threeDInteractions.sfx.arcade.miamiHeatwave?.url
      },
      contact: {
        interference: threeDInteractions.sfx.contact.interference?.url ?? ""
      },
      music: {
        aqua: threeDInteractions.sfx.music.aqua.url,
        rain: threeDInteractions.sfx.music.rain.url,
        tiger: threeDInteractions.sfx.music.tiger.url,
        vhs: threeDInteractions.sfx.music.vhs.url
      }
    },
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
      })),
      postprocessing: {
        contrast: item.postprocessing?.contrast ?? 1,
        brightness: item.postprocessing?.brightness ?? 1,
        exposure: item.postprocessing?.exposure ?? 1,
        gamma: item.postprocessing?.gamma ?? 1,
        vignetteRadius: item.postprocessing?.vignetteRadius ?? 1,
        vignetteSpread: item.postprocessing?.vignetteSpread ?? 1,
        bloomStrength: item.postprocessing?.bloomStrength ?? 1,
        bloomRadius: item.postprocessing?.bloomRadius ?? 1,
        bloomThreshold: item.postprocessing?.bloomThreshold ?? 1
      }
    })),
    characters: {
      model: threeDInteractions.characters.model.file?.url ?? "",
      textureBody: threeDInteractions.characters.textureBody?.url,
      textureFaces: threeDInteractions.characters.textureFaces.url,
      textureArms: threeDInteractions.characters.textureArms.url,
      textureComic: threeDInteractions.characters.textureComic.url
    },
    pets: {
      model: threeDInteractions.characters.petModel.file.url,
      pureTexture: threeDInteractions.characters.pureTexture.url,
      bostonTexture: threeDInteractions.characters.bostonTexture.url
    },
    outdoorCars: threeDInteractions.outdoorCars.model?.file?.url ?? "",
    lamp: {
      extraLightmap: threeDInteractions.lamp.extraLightmap?.url ?? ""
    },
    physicsParams: threeDInteractions.physicsParams.items.map((item) => ({
      _title: item._title,
      value: item.value ?? 0
    }))
  }
}
