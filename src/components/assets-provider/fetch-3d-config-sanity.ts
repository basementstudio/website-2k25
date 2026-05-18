import { client } from "@/service/sanity"
import { token } from "@/service/sanity/token"

// ---------------------------------------------------------------------------
// Raw Sanity types returned by GROQ
// ---------------------------------------------------------------------------

interface SanitySpec {
  specId?: string
  title?: string
  value?: string
}

interface SanityInspectableContent {
  inspectableId?: string
  title?: string
  specs?: SanitySpec[]
  description?: unknown
}

interface SanityCameraConfig {
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

interface SanityPostprocessing {
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

interface SanitySceneTab {
  tabName?: string
  tabRoute?: string
  tabHoverName?: string
  tabClickableName?: string
  plusShapeScale?: number
}

interface SanitySceneConfig {
  sceneName?: string
  cameraConfig?: SanityCameraConfig
  postprocessing?: SanityPostprocessing
  tabs?: SanitySceneTab[]
}

interface SanityPhysicsParam {
  title?: string
  value?: number
}

interface SanityPhysicsConfig {
  physicsParams?: SanityPhysicsParam[]
}

export interface SanityThreeDConfigResult {
  inspectables: SanityInspectableContent[]
  scenes: SanitySceneConfig[]
  physics: SanityPhysicsConfig | null
}

// ---------------------------------------------------------------------------
// GROQ — single round-trip fetch for all three types
// ---------------------------------------------------------------------------

const threeDConfigQuery = /* groq */ `{
  "inspectables": *[_type == "inspectableContent"] {
    inspectableId,
    title,
    specs[] {
      specId,
      title,
      value
    },
    description
  },
  "scenes": *[_type == "sceneConfig"] {
    sceneName,
    cameraConfig {
      posX, posY, posZ,
      tarX, tarY, tarZ,
      fov,
      targetScrollY,
      offsetMultiplier
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
    },
    tabs[] {
      tabName,
      tabRoute,
      tabHoverName,
      tabClickableName,
      plusShapeScale
    }
  },
  "physics": *[_type == "physicsConfig"][0] {
    physicsParams[] {
      title,
      value
    }
  }
}`

// The base client is unauthenticated; the dataset is private, so we configure
// once at module scope rather than per-request.
const configClient = client.withConfig({ token, useCdn: true })

export async function fetchThreeDConfig(): Promise<SanityThreeDConfigResult> {
  return configClient.fetch<SanityThreeDConfigResult>(threeDConfigQuery, {}, {
    perspective: "published"
  })
}
