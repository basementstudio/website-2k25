import { sanityFetch } from "@/service/sanity"
import { client } from "@/service/sanity/client"
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

interface SanityMeshReplacement {
  assetId?: string | null
  url?: string | null
  x?: number | null
  y?: number | null
  z?: number | null
}

interface SanityMeshOverride {
  mesh?: string | null
  x?: number | null
  y?: number | null
  z?: number | null
  hidden?: boolean | null
  replacement?: SanityMeshReplacement | null
}

export interface SanityMapAssetsConfig {
  office?: string | null
  officeItems?: string | null
  officeWireframe?: string | null
  outdoor?: string | null
  outdoorCars?: string | null
  godrays?: string | null
  routingElements?: string | null
  basketball?: string | null
  basketballNet?: string | null
  contactPhone?: string | null
  mapTextures?: {
    rain?: string | null
    basketballVa?: string | null
  } | null
  meshOverrides?: SanityMeshOverride[] | null
}

export interface SanityThreeDConfigResult {
  // Sub-queries return null when the singleton doesn't exist; consumers must coalesce.
  inspectables: SanityInspectableContent[] | null
  scenes: SanitySceneConfig[] | null
  physics: SanityPhysicsConfig | null
  mapAssets: SanityMapAssetsConfig | null
}

// ---------------------------------------------------------------------------
// GROQ — single round-trip fetch for all three types
// ---------------------------------------------------------------------------

const threeDConfigQuery = /* groq */ `{
  "inspectables": *[_type == "inspectablesConfig"][0].inspectables[] {
    inspectableId,
    title,
    specs[] {
      specId,
      title,
      value
    },
    description
  },
  "scenes": *[_type == "scenesConfig"][0].scenes[] {
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
  },
  "mapAssets": *[_type == "mapAssetsConfig"][0] {
    "office": office.asset->url,
    "officeItems": officeItems.asset->url,
    "officeWireframe": officeWireframe.asset->url,
    "outdoor": outdoor.asset->url,
    "outdoorCars": outdoorCars.asset->url,
    "godrays": godrays.asset->url,
    "routingElements": routingElements.asset->url,
    "basketball": basketball.asset->url,
    "basketballNet": basketballNet.asset->url,
    "contactPhone": contactPhone.asset->url,
    "mapTextures": {
      "rain": mapTextures.rain.asset->url,
      "basketballVa": mapTextures.basketballVa.asset->url
    },
    meshOverrides[] {
      mesh,
      x,
      y,
      z,
      hidden,
      replacement {
        "assetId": file.asset._ref,
        "url": file.asset->url,
        x,
        y,
        z
      }
    }
  }
}`

/**
 * Draft-aware, like the rest of the site's content: `sanityFetch` resolves to
 * drafts when Next's draft mode is on and published otherwise. The perspective
 * used to be pinned to "published", which meant a mesh position saved in the
 * Editor was invisible everywhere except the Editor itself — even under an
 * active preview session.
 *
 * `stega: false` stays pinned. Draft mode normally turns stega on, and these
 * results are asset URLs and mesh names, not display copy — invisible marker
 * characters in a GLB URL or a mesh name break loading and name matching.
 */
export async function fetchThreeDConfig(): Promise<SanityThreeDConfigResult> {
  return sanityFetch<SanityThreeDConfigResult>({
    query: threeDConfigQuery,
    stega: false
  })
}

/**
 * Same config, read from drafts — for the Studio's Editor tool only.
 *
 * The Editor's Save writes to `drafts.mapAssetsConfig` so nothing reaches the
 * live site until someone hits Publish. Without this the editor would reload
 * into the published positions and the work would look lost.
 *
 * Not the Live `sanityFetch`: the editor route is uncached (a preview has to be
 * fresh), and Live's `cacheTag()` is only legal inside a `"use cache"` scope.
 * Drafts also aren't public, hence the token and `useCdn: false`.
 */
export async function fetchThreeDConfigDrafts(): Promise<SanityThreeDConfigResult> {
  if (!token) {
    console.warn(
      "[3d-config] SANITY_READ_TOKEN is missing — the scene editor is showing published data, so anything saved but not published won't appear."
    )
    return fetchThreeDConfig()
  }

  return client
    .withConfig({ token, useCdn: false, stega: false })
    .fetch<SanityThreeDConfigResult>(
      threeDConfigQuery,
      {},
      { perspective: "drafts" }
    )
}
