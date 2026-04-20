import { sanityFetch } from "@/service/sanity"

// ---------------------------------------------------------------------------
// Raw Sanity types (what GROQ returns before transformation)
// ---------------------------------------------------------------------------

interface SanityFileUrl {
  asset?: { url?: string } | null
}

interface SanityBake {
  title?: string
  lightmap?: SanityFileUrl
  ambientOcclusion?: SanityFileUrl
  meshes?: string[]
}

interface SanityMatcap {
  mesh?: string
  file?: SanityFileUrl
  isGlass?: boolean
}

interface SanityGlassReflex {
  mesh?: string
  url?: SanityFileUrl
}

interface SanityVideo {
  mesh?: string
  url?: SanityFileUrl
  intensity?: number
}

interface SanityInspectable {
  inspectableId?: string
  title?: string
  specs?: {
    specId?: string
    title?: string
    value?: string
  }[]
  description?: unknown
  mesh?: string
  xOffset?: number
  yOffset?: number
  xRotationOffset?: number
  sizeTarget?: number
  scenes?: string[]
  fx?: SanityFileUrl
}

interface SanityScene {
  name?: string
  cameraConfig?: {
    posX?: number
    posY?: number
    posZ?: number
    tarX?: number
    tarY?: number
    tarZ?: number
    fov?: number
    targetScrollY?: number
    offsetMultiplier?: number
  }
  tabs?: {
    tabName?: string
    tabRoute?: string
    tabHoverName?: string
    tabClickableName?: string
    plusShapeScale?: number
  }[]
  postprocessing?: {
    contrast?: number
    brightness?: number
    exposure?: number
    gamma?: number
    vignetteRadius?: number
    vignetteSpread?: number
    bloomStrength?: number
    bloomRadius?: number
    bloomThreshold?: number
  }
}

interface SanityDoorSfx {
  open?: SanityFileUrl
  close?: SanityFileUrl
}

interface SanityLampSfx {
  pull?: SanityFileUrl
  release?: SanityFileUrl
}

interface SanityButtonSfx {
  press?: SanityFileUrl
  release?: SanityFileUrl
}

export interface SanityThreeDAssetsResult {
  // Map models (file → url string)
  officeItems?: SanityFileUrl
  office?: SanityFileUrl
  officeWireframe?: SanityFileUrl
  outdoor?: SanityFileUrl
  godrays?: SanityFileUrl
  basketball?: SanityFileUrl
  basketballNet?: SanityFileUrl
  contactPhone?: SanityFileUrl
  routingElements?: SanityFileUrl
  outdoorCars?: SanityFileUrl

  // Map textures
  mapTextures?: {
    rain?: SanityFileUrl
    basketballVa?: SanityFileUrl
  }

  // Special events
  specialEvents?: {
    christmas?: {
      tree?: SanityFileUrl
      song?: SanityFileUrl
    }
  }

  // Bakes
  bakes?: SanityBake[]

  // Matcaps
  matcaps?: SanityMatcap[]

  // String arrays
  glassMaterials?: string[]
  doubleSideElements?: string[]

  // Glass reflexes
  glassReflexes?: SanityGlassReflex[]

  // Arcade
  arcade?: {
    idleScreen?: SanityFileUrl
    placeholderLab?: SanityFileUrl
    boot?: SanityFileUrl
    chronicles?: SanityFileUrl
    looper?: SanityFileUrl
    palm?: SanityFileUrl
    skybox?: SanityFileUrl
    cityscape?: SanityFileUrl
    introScreen?: SanityFileUrl
  }

  // Videos
  videos?: SanityVideo[]

  // Inspectables
  inspectables?: SanityInspectable[]

  // SFX
  sfx?: {
    basketballTheme?: SanityFileUrl
    basketballSwoosh?: SanityFileUrl
    basketballNet?: SanityFileUrl
    basketballThump?: SanityFileUrl
    basketballBuzzer?: SanityFileUrl
    basketballStreak?: SanityFileUrl
    knobTurning?: SanityFileUrl
    antenna?: SanityFileUrl
    blog?: {
      lockedDoor?: SanityFileUrl[]
      door?: SanityDoorSfx[]
      lamp?: SanityLampSfx[]
    }
    arcade?: {
      buttons?: SanityButtonSfx[]
      sticks?: SanityButtonSfx[]
      miamiHeatwave?: SanityFileUrl
    }
    music?: {
      aqua?: SanityFileUrl
      rain?: SanityFileUrl
      tiger?: SanityFileUrl
      vhs?: SanityFileUrl
    }
    contact?: {
      interference?: SanityFileUrl
    }
  }

  // Scenes
  scenes?: SanityScene[]

  // Characters
  characters?: {
    model?: SanityFileUrl
    textureBody?: SanityFileUrl
    textureFaces?: SanityFileUrl
    textureArms?: SanityFileUrl
    textureComic?: SanityFileUrl
  }

  // Pets
  pets?: {
    model?: SanityFileUrl
    pureTexture?: SanityFileUrl
    bostonTexture?: SanityFileUrl
  }

  // Lamp
  lamp?: {
    extraLightmap?: SanityFileUrl
  }

  // Physics params
  physicsParams?: {
    title?: string
    value?: number
  }[]
}

// ---------------------------------------------------------------------------
// GROQ query
// ---------------------------------------------------------------------------

/**
 * Single GROQ query that fetches the entire threeDAssets singleton.
 *
 * File fields are projected with `{ asset->{ url } }` so the fetch function
 * can extract `.asset.url` from each.
 */
const fileProjection = `{ asset->{ url } }`

const threeDAssetsQuery = /* groq */ `
  *[_type == "threeDAssets"][0]{
    // --- Map models ---
    officeItems ${fileProjection},
    office ${fileProjection},
    officeWireframe ${fileProjection},
    outdoor ${fileProjection},
    godrays ${fileProjection},
    basketball ${fileProjection},
    basketballNet ${fileProjection},
    contactPhone ${fileProjection},
    routingElements ${fileProjection},
    outdoorCars ${fileProjection},

    // --- Map textures ---
    mapTextures {
      rain ${fileProjection},
      basketballVa ${fileProjection}
    },

    // --- Special events ---
    specialEvents {
      christmas {
        tree ${fileProjection},
        song ${fileProjection}
      }
    },

    // --- Bakes ---
    bakes[] {
      title,
      lightmap ${fileProjection},
      ambientOcclusion ${fileProjection},
      meshes
    },

    // --- Matcaps ---
    matcaps[] {
      mesh,
      file ${fileProjection},
      isGlass
    },

    // --- String arrays ---
    glassMaterials,
    doubleSideElements,

    // --- Glass reflexes ---
    glassReflexes[] {
      mesh,
      url ${fileProjection}
    },

    // --- Arcade ---
    arcade {
      idleScreen ${fileProjection},
      placeholderLab ${fileProjection},
      boot ${fileProjection},
      chronicles ${fileProjection},
      looper ${fileProjection},
      palm ${fileProjection},
      skybox ${fileProjection},
      cityscape ${fileProjection},
      introScreen ${fileProjection}
    },

    // --- Videos ---
    videos[] {
      mesh,
      url ${fileProjection},
      intensity
    },

    // --- Inspectables ---
    inspectables[] {
      inspectableId,
      title,
      specs[] {
        specId,
        title,
        value
      },
      description,
      mesh,
      xOffset,
      yOffset,
      xRotationOffset,
      sizeTarget,
      scenes,
      fx ${fileProjection}
    },

    // --- SFX ---
    sfx {
      basketballTheme ${fileProjection},
      basketballSwoosh ${fileProjection},
      basketballNet ${fileProjection},
      basketballThump ${fileProjection},
      basketballBuzzer ${fileProjection},
      basketballStreak ${fileProjection},
      knobTurning ${fileProjection},
      antenna ${fileProjection},
      blog {
        lockedDoor[] ${fileProjection},
        door[] {
          open ${fileProjection},
          close ${fileProjection}
        },
        lamp[] {
          pull ${fileProjection},
          release ${fileProjection}
        }
      },
      arcade {
        buttons[] {
          press ${fileProjection},
          release ${fileProjection}
        },
        sticks[] {
          press ${fileProjection},
          release ${fileProjection}
        },
        miamiHeatwave ${fileProjection}
      },
      music {
        aqua ${fileProjection},
        rain ${fileProjection},
        tiger ${fileProjection},
        vhs ${fileProjection}
      },
      contact {
        interference ${fileProjection}
      }
    },

    // --- Scenes ---
    scenes[] {
      name,
      cameraConfig {
        posX,
        posY,
        posZ,
        tarX,
        tarY,
        tarZ,
        fov,
        targetScrollY,
        offsetMultiplier
      },
      tabs[] {
        tabName,
        tabRoute,
        tabHoverName,
        tabClickableName,
        plusShapeScale
      },
      postprocessing {
        contrast,
        brightness,
        exposure,
        gamma,
        vignetteRadius,
        vignetteSpread,
        bloomStrength,
        bloomRadius,
        bloomThreshold
      }
    },

    // --- Characters ---
    characters {
      model ${fileProjection},
      textureBody ${fileProjection},
      textureFaces ${fileProjection},
      textureArms ${fileProjection},
      textureComic ${fileProjection}
    },

    // --- Pets ---
    pets {
      model ${fileProjection},
      pureTexture ${fileProjection},
      bostonTexture ${fileProjection}
    },

    // --- Lamp ---
    lamp {
      extraLightmap ${fileProjection}
    },

    // --- Physics params ---
    physicsParams[] {
      title,
      value
    }
  }
`

// ---------------------------------------------------------------------------
// Fetch function
// ---------------------------------------------------------------------------

export async function fetchThreeDAssets(): Promise<SanityThreeDAssetsResult> {
  const result = await sanityFetch<SanityThreeDAssetsResult>({
    query: threeDAssetsQuery,
    stega: false
  })
  return result
}
