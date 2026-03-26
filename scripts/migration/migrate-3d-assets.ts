import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { convertRichText } from './utils/rich-text'
import { nanoid } from 'nanoid'

export default async function migrate3DAssets() {
  console.log('  Fetching 3D assets data from BaseHub...')

  const data = await basehubClient.query({
    threeDInteractions: {
      map: {
        office: { file: { url: true } },
        officeItems: { file: { url: true } },
        outdoor: { file: { url: true } },
        godrays: { file: { url: true } },
        routingElements: { file: { url: true } },
        wireframeModel: { file: { url: true } },
        bakes: {
          items: {
            _title: true,
            lightmap: { url: true },
            ambientOcclusion: { url: true },
            meshes: { items: { _title: true } },
          },
        },
        glassReflexes: { items: { _title: true, file: { url: true } } },
        matcaps: {
          items: { _title: true, file: { url: true }, isGlass: true },
        },
        videos: {
          items: { _title: true, file: { url: true }, intensity: true },
        },
        glassMaterials: { items: { _title: true } },
        doubleSideElements: { items: { _title: true } },
        textures: { rain: { url: true }, basketballVa: { url: true } },
      },
      sfx: {
        basketballTheme: { url: true },
        basketballSwoosh: { url: true },
        basketballNet: { url: true },
        basketballThump: { url: true },
        basketballBuzzer: { url: true },
        basketballStreak: { url: true },
        knobTurning: { url: true },
        antenna: { url: true },
        blog: {
          lockedDoor: { items: { sound: { url: true } } },
          door: { items: { open: { url: true }, close: { url: true } } },
          lamp: { items: { pull: { url: true }, release: { url: true } } },
        },
        arcade: {
          buttons: { items: { press: { url: true }, release: { url: true } } },
          sticks: { items: { press: { url: true }, release: { url: true } } },
          miamiHeatwave: { url: true },
        },
        music: {
          aqua: { url: true },
          rain: { url: true },
          tiger: { url: true },
          vhs: { url: true },
        },
        contact: { interference: { url: true } },
      },
      basketball: { file: { url: true } },
      basketballNet: { file: { url: true } },
      contactPhone: { file: { url: true } },
      arcade: {
        idleScreen: { url: true },
        placeholderLab: { url: true },
        boot: { url: true },
        chronicles: { url: true },
        looper: { url: true },
        palm: { url: true },
        sky: { url: true },
        cityscape: { url: true },
        introScreen: { url: true },
      },
      specialEvents: {
        christmas: {
          tree: { file: { url: true } },
          song: { url: true },
        },
      },
      scenes: {
        scenes: {
          items: {
            _title: true,
            cameraConfig: {
              posX: true,
              posY: true,
              posZ: true,
              tarX: true,
              tarY: true,
              tarZ: true,
              fov: true,
              targetScrollY: true,
              offsetMultiplier: true,
            },
            tabs: {
              items: {
                _title: true,
                tabRoute: true,
                tabHoverName: true,
                tabClickableName: true,
                plusShapeScale: true,
              },
            },
            postprocessing: {
              contrast: true,
              brightness: true,
              exposure: true,
              gamma: true,
              vignetteRadius: true,
              vignetteSpread: true,
              bloomStrength: true,
              bloomRadius: true,
              bloomThreshold: true,
            },
          },
        },
      },
      outdoorCars: { model: { file: { url: true } } },
      characters: {
        model: { file: { url: true } },
        textureBody: { url: true },
        textureFaces: { url: true },
        textureArms: { url: true },
        textureComic: { url: true },
        petModel: { file: { url: true } },
        pureTexture: { url: true },
        bostonTexture: { url: true },
      },
      lamp: { extraLightmap: { url: true } },
      physicsParams: { items: { _title: true, value: true } },
    },
    pages: {
      inspectables: {
        inspectableList: {
          items: {
            _id: true,
            _title: true,
            mesh: true,
            specs: { items: { _id: true, _title: true, value: true } },
            description: { json: { content: true } },
            xOffset: true,
            yOffset: true,
            xRotationOffset: true,
            sizeTarget: true,
            scenes: { _title: true },
            fx: { url: true },
          },
        },
      },
    },
  })

  const threeD = data.threeDInteractions as any
  const map = threeD.map
  const sfx = threeD.sfx
  const arcadeData = threeD.arcade
  const characters = threeD.characters
  const scenesData = threeD.scenes
  const inspectableItems =
    (data.pages as any).inspectables?.inspectableList?.items || []

  console.log('  Building 3D assets document...')

  // --- Arrays ---

  const bakes = (map.bakes?.items || []).map((item: any) => ({
    _key: nanoid(12),
    title: item._title,
    lightmap: item.lightmap?.url ?? '',
    ambientOcclusion: item.ambientOcclusion?.url ?? '',
    meshes: (item.meshes?.items || []).map((m: any) => m._title),
  }))

  const matcaps = (map.matcaps?.items || []).map((item: any) => ({
    _key: nanoid(12),
    mesh: item._title,
    file: item.file?.url ?? '',
    isGlass: item.isGlass ?? false,
  }))

  const glassMaterials = (map.glassMaterials?.items || []).map(
    (item: any) => item._title
  )

  const doubleSideElements = (map.doubleSideElements?.items || []).map(
    (item: any) => item._title
  )

  const glassReflexes = (map.glassReflexes?.items || []).map((item: any) => ({
    _key: nanoid(12),
    mesh: item._title,
    url: item.file?.url ?? '',
  }))

  const videos = (map.videos?.items || []).map((item: any) => ({
    _key: nanoid(12),
    mesh: item._title,
    url: item.file?.url ?? '',
    intensity: item.intensity ?? 1,
  }))

  const physicsParams = (threeD.physicsParams?.items || []).map(
    (item: any) => ({
      _key: nanoid(12),
      title: item._title,
      value: item.value ?? 0,
    })
  )

  // --- Scenes ---

  const scenes = (scenesData?.scenes?.items || []).map((item: any) => ({
    _key: nanoid(12),
    name: item._title,
    cameraConfig: {
      posX: item.cameraConfig?.posX ?? 0,
      posY: item.cameraConfig?.posY ?? 0,
      posZ: item.cameraConfig?.posZ ?? 0,
      tarX: item.cameraConfig?.tarX ?? 0,
      tarY: item.cameraConfig?.tarY ?? 0,
      tarZ: item.cameraConfig?.tarZ ?? 0,
      fov: item.cameraConfig?.fov ?? 60,
      targetScrollY: item.cameraConfig?.targetScrollY ?? -1.5,
      offsetMultiplier: item.cameraConfig?.offsetMultiplier ?? 1,
    },
    tabs: (item.tabs?.items || []).map((tab: any) => ({
      _key: nanoid(12),
      tabName: tab._title,
      tabRoute: tab.tabRoute ?? '',
      tabHoverName: tab.tabHoverName ?? '',
      tabClickableName: tab.tabClickableName ?? '',
      plusShapeScale: tab.plusShapeScale ?? 1,
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
      bloomThreshold: item.postprocessing?.bloomThreshold ?? 1,
    },
  }))

  // --- Inspectables (async due to convertRichText) ---

  const inspectables = []
  for (const item of inspectableItems) {
    const description = await convertRichText(
      item.description?.json?.content
    )
    inspectables.push({
      _key: nanoid(12),
      inspectableId: item._id ?? '',
      title: item._title ?? '',
      specs: (item.specs?.items || []).map((s: any) => ({
        _key: nanoid(12),
        specId: s._id,
        title: s._title,
        value: s.value ?? '',
      })),
      description,
      mesh: item.mesh ?? '',
      xOffset: item.xOffset ?? 0,
      yOffset: item.yOffset ?? 0,
      xRotationOffset: item.xRotationOffset ?? 0,
      sizeTarget: item.sizeTarget ?? 0,
      scenes: item.scenes?.map((s: any) => s._title) ?? [],
      fx: item.fx?.url ?? '',
    })
  }

  // --- SFX ---

  const sfxDoc = {
    basketballTheme: sfx.basketballTheme?.url,
    basketballSwoosh: sfx.basketballSwoosh?.url,
    basketballNet: sfx.basketballNet?.url,
    basketballThump: sfx.basketballThump?.url,
    basketballBuzzer: sfx.basketballBuzzer?.url,
    basketballStreak: sfx.basketballStreak?.url,
    knobTurning: sfx.knobTurning?.url ?? '',
    antenna: sfx.antenna?.url ?? '',
    blog: {
      lockedDoor: (sfx.blog?.lockedDoor?.items || []).map(
        (item: any) => item.sound?.url ?? ''
      ),
      door: (sfx.blog?.door?.items || []).map((item: any) => ({
        _key: nanoid(12),
        open: item.open?.url ?? '',
        close: item.close?.url ?? '',
      })),
      lamp: (sfx.blog?.lamp?.items || []).map((item: any) => ({
        _key: nanoid(12),
        pull: item.pull?.url ?? '',
        release: item.release?.url ?? '',
      })),
    },
    arcade: {
      buttons: (sfx.arcade?.buttons?.items || []).map((item: any) => ({
        _key: nanoid(12),
        press: item.press?.url ?? '',
        release: item.release?.url ?? '',
      })),
      sticks: (sfx.arcade?.sticks?.items || []).map((item: any) => ({
        _key: nanoid(12),
        press: item.press?.url ?? '',
        release: item.release?.url ?? '',
      })),
      miamiHeatwave: sfx.arcade?.miamiHeatwave?.url,
    },
    music: {
      aqua: sfx.music?.aqua?.url,
      rain: sfx.music?.rain?.url,
      tiger: sfx.music?.tiger?.url,
      vhs: sfx.music?.vhs?.url,
    },
    contact: {
      interference: sfx.contact?.interference?.url ?? '',
    },
  }

  // --- Build the full Sanity document ---

  await sanityWriteClient.createOrReplace({
    _id: 'threeDAssets',
    _type: 'threeDAssets',

    // Simple URL fields
    officeItems: map.officeItems?.file?.url,
    office: map.office?.file?.url,
    officeWireframe: map.wireframeModel?.file?.url,
    outdoor: map.outdoor?.file?.url,
    godrays: map.godrays?.file?.url,
    basketball: threeD.basketball?.file?.url,
    basketballNet: threeD.basketballNet?.file?.url,
    contactPhone: threeD.contactPhone?.file?.url,
    routingElements: map.routingElements?.file?.url,
    outdoorCars: threeD.outdoorCars?.model?.file?.url,

    // Nested objects
    specialEvents: {
      christmas: {
        tree: threeD.specialEvents?.christmas?.tree?.file?.url,
        song: threeD.specialEvents?.christmas?.song?.url,
      },
    },
    arcade: {
      idleScreen: arcadeData?.idleScreen?.url,
      placeholderLab: arcadeData?.placeholderLab?.url,
      boot: arcadeData?.boot?.url,
      chronicles: arcadeData?.chronicles?.url,
      looper: arcadeData?.looper?.url,
      palm: arcadeData?.palm?.url,
      skybox: arcadeData?.sky?.url,
      cityscape: arcadeData?.cityscape?.url,
      introScreen: arcadeData?.introScreen?.url,
    },
    characters: {
      model: characters?.model?.file?.url,
      textureBody: characters?.textureBody?.url,
      textureFaces: characters?.textureFaces?.url,
      textureArms: characters?.textureArms?.url,
      textureComic: characters?.textureComic?.url,
    },
    pets: {
      model: characters?.petModel?.file?.url,
      pureTexture: characters?.pureTexture?.url,
      bostonTexture: characters?.bostonTexture?.url,
    },
    lamp: {
      extraLightmap: threeD.lamp?.extraLightmap?.url,
    },
    mapTextures: {
      rain: map.textures?.rain?.url,
      basketballVa: map.textures?.basketballVa?.url,
    },

    // Arrays
    bakes,
    matcaps,
    glassMaterials,
    doubleSideElements,
    glassReflexes,
    videos,
    physicsParams,
    scenes,
    inspectables,

    // SFX
    sfx: sfxDoc,
  })

  console.log('  3D assets singleton created (threeDAssets)')
}
