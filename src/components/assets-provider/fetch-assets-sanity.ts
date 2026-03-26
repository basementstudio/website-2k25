import type { AssetsResult } from "./fetch-assets"
import { fetchThreeDAssets } from "./sanity"

/**
 * Extract a URL string from a Sanity file field projected as `{ asset->{ url } }`.
 * Returns empty string when the asset is missing or not yet uploaded.
 */
function fileUrl(
  field: { asset?: { url?: string } | null } | null | undefined
): string {
  return field?.asset?.url ?? ""
}

/**
 * Fetches all 3D assets from Sanity and maps the result to the `AssetsResult`
 * interface expected by the 3D layer.
 */
export async function fetchAssetsSanity(): Promise<AssetsResult> {
  const data = await fetchThreeDAssets()

  return {
    // --- Map models ---
    officeItems: fileUrl(data.officeItems),
    office: fileUrl(data.office),
    officeWireframe: fileUrl(data.officeWireframe),
    outdoor: fileUrl(data.outdoor),
    godrays: fileUrl(data.godrays),
    basketball: fileUrl(data.basketball),
    basketballNet: fileUrl(data.basketballNet),
    contactPhone: fileUrl(data.contactPhone),
    routingElements: fileUrl(data.routingElements),
    outdoorCars: fileUrl(data.outdoorCars),

    // --- Map textures ---
    mapTextures: {
      rain: fileUrl(data.mapTextures?.rain),
      basketballVa: fileUrl(data.mapTextures?.basketballVa),
    },

    // --- Special events ---
    specialEvents: {
      christmas: {
        tree: fileUrl(data.specialEvents?.christmas?.tree),
        song: fileUrl(data.specialEvents?.christmas?.song),
      },
    },

    // --- Bakes ---
    bakes: (data.bakes ?? []).map((bake) => ({
      title: bake.title ?? "",
      lightmap: fileUrl(bake.lightmap),
      ambientOcclusion: fileUrl(bake.ambientOcclusion),
      meshes: bake.meshes ?? [],
    })),

    // --- Matcaps ---
    matcaps: (data.matcaps ?? []).map((matcap) => ({
      mesh: matcap.mesh ?? "",
      file: fileUrl(matcap.file),
      isGlass: matcap.isGlass ?? false,
    })),

    // --- String arrays ---
    glassMaterials: data.glassMaterials ?? [],
    doubleSideElements: data.doubleSideElements ?? [],

    // --- Glass reflexes ---
    glassReflexes: (data.glassReflexes ?? []).map((item) => ({
      mesh: item.mesh ?? "",
      url: fileUrl(item.url),
    })),

    // --- Arcade ---
    arcade: {
      idleScreen: fileUrl(data.arcade?.idleScreen),
      placeholderLab: fileUrl(data.arcade?.placeholderLab),
      boot: fileUrl(data.arcade?.boot),
      chronicles: fileUrl(data.arcade?.chronicles),
      looper: fileUrl(data.arcade?.looper),
      palm: fileUrl(data.arcade?.palm),
      skybox: fileUrl(data.arcade?.skybox),
      cityscape: fileUrl(data.arcade?.cityscape),
      introScreen: fileUrl(data.arcade?.introScreen),
    },

    // --- Videos ---
    videos: (data.videos ?? []).map((video) => ({
      mesh: video.mesh ?? "",
      url: fileUrl(video.url),
      intensity: video.intensity ?? 1,
    })),

    // --- Inspectables ---
    inspectables: (data.inspectables ?? []).map((item) => ({
      id: item.inspectableId ?? "",
      _title: item.title ?? "",
      specs: (item.specs ?? []).map((spec) => ({
        _id: spec.specId ?? "",
        _title: spec.title ?? "",
        value: spec.value ?? "",
      })),
      description: item.description,
      mesh: item.mesh ?? "",
      xOffset: item.xOffset ?? 0,
      yOffset: item.yOffset ?? 0,
      xRotationOffset: item.xRotationOffset ?? 0,
      sizeTarget: item.sizeTarget ?? 0,
      scenes: item.scenes ?? [],
      fx: fileUrl(item.fx),
    })),

    // --- SFX ---
    sfx: {
      basketballTheme: fileUrl(data.sfx?.basketballTheme),
      basketballSwoosh: fileUrl(data.sfx?.basketballSwoosh),
      basketballNet: fileUrl(data.sfx?.basketballNet),
      basketballThump: fileUrl(data.sfx?.basketballThump),
      basketballBuzzer: fileUrl(data.sfx?.basketballBuzzer),
      basketballStreak: fileUrl(data.sfx?.basketballStreak),
      knobTurning: fileUrl(data.sfx?.knobTurning),
      antenna: fileUrl(data.sfx?.antenna),
      blog: {
        lockedDoor: (data.sfx?.blog?.lockedDoor ?? []).map((item) =>
          fileUrl(item)
        ),
        door: (data.sfx?.blog?.door ?? []).map((item) => ({
          open: fileUrl(item.open),
          close: fileUrl(item.close),
        })),
        lamp: (data.sfx?.blog?.lamp ?? []).map((item) => ({
          pull: fileUrl(item.pull),
          release: fileUrl(item.release),
        })),
      },
      arcade: {
        buttons: (data.sfx?.arcade?.buttons ?? []).map((item) => ({
          press: fileUrl(item.press),
          release: fileUrl(item.release),
        })),
        sticks: (data.sfx?.arcade?.sticks ?? []).map((item) => ({
          press: fileUrl(item.press),
          release: fileUrl(item.release),
        })),
        miamiHeatwave: fileUrl(data.sfx?.arcade?.miamiHeatwave),
      },
      music: {
        aqua: fileUrl(data.sfx?.music?.aqua),
        rain: fileUrl(data.sfx?.music?.rain),
        tiger: fileUrl(data.sfx?.music?.tiger),
        vhs: fileUrl(data.sfx?.music?.vhs),
      },
      contact: {
        interference: fileUrl(data.sfx?.contact?.interference),
      },
    },

    // --- Scenes ---
    scenes: (data.scenes ?? []).map((scene) => ({
      name: scene.name ?? "",
      cameraConfig: {
        position: [
          scene.cameraConfig?.posX ?? 0,
          scene.cameraConfig?.posY ?? 0,
          scene.cameraConfig?.posZ ?? 0,
        ],
        target: [
          scene.cameraConfig?.tarX ?? 0,
          scene.cameraConfig?.tarY ?? 0,
          scene.cameraConfig?.tarZ ?? 0,
        ],
        fov: scene.cameraConfig?.fov ?? 60,
        targetScrollY: scene.cameraConfig?.targetScrollY ?? -1.5,
        offsetMultiplier: scene.cameraConfig?.offsetMultiplier ?? 1,
      },
      tabs: (scene.tabs ?? []).map((tab) => ({
        tabName: tab.tabName ?? "",
        tabRoute: tab.tabRoute ?? "",
        tabHoverName: tab.tabHoverName ?? "",
        tabClickableName: tab.tabClickableName ?? "",
        plusShapeScale: tab.plusShapeScale ?? 1,
      })),
      postprocessing: {
        contrast: scene.postprocessing?.contrast ?? 1,
        brightness: scene.postprocessing?.brightness ?? 1,
        exposure: scene.postprocessing?.exposure ?? 1,
        gamma: scene.postprocessing?.gamma ?? 1,
        vignetteRadius: scene.postprocessing?.vignetteRadius ?? 1,
        vignetteSpread: scene.postprocessing?.vignetteSpread ?? 1,
        bloomStrength: scene.postprocessing?.bloomStrength ?? 1,
        bloomRadius: scene.postprocessing?.bloomRadius ?? 1,
        bloomThreshold: scene.postprocessing?.bloomThreshold ?? 1,
      },
    })),

    // --- Characters ---
    characters: {
      model: fileUrl(data.characters?.model),
      textureBody: fileUrl(data.characters?.textureBody),
      textureFaces: fileUrl(data.characters?.textureFaces),
      textureArms: fileUrl(data.characters?.textureArms),
      textureComic: fileUrl(data.characters?.textureComic),
    },

    // --- Pets ---
    pets: {
      model: fileUrl(data.pets?.model),
      pureTexture: fileUrl(data.pets?.pureTexture),
      bostonTexture: fileUrl(data.pets?.bostonTexture),
    },

    // --- Lamp ---
    lamp: {
      extraLightmap: fileUrl(data.lamp?.extraLightmap),
    },

    // --- Physics params ---
    physicsParams: (data.physicsParams ?? []).map((item) => ({
      _title: item.title ?? "",
      value: item.value ?? 0,
    })),
  }
}
