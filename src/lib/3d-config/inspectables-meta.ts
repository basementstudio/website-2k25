// TS-side per-inspectable metadata: mesh, offsets, sizeTarget, scenes, fx URL.
// Editor-facing fields (title / specs / description) live in Sanity as
// inspectableContent docs and are joined by id in fetch-assets-local.ts.
//
// See ./README.md for how to add or edit inspectables.

// Scenes that can host an inspectable. Extend when a new scene gets one.
export type SceneName = "showcase" | "services" | "blog" | "people"

export interface InspectableMeta {
  id: string
  mesh: string
  xOffset: number
  yOffset: number
  xRotationOffset: number
  sizeTarget: number
  scenes: SceneName[]
  fx: string
}

export const INSPECTABLES_META: InspectableMeta[] = [
  {
    "id": "mr-beast",
    "mesh": "SM_MrBeast",
    "xOffset": -0.088,
    "yOffset": 0,
    "xRotationOffset": 0,
    "sizeTarget": 0.3,
    "scenes": [
      "showcase"
    ],
    "fx": ""
  },
  {
    "id": "swaggersouls",
    "mesh": "SM_Swaggersouls",
    "xOffset": -0.086,
    "yOffset": 0.02,
    "xRotationOffset": 0,
    "sizeTarget": 0.28,
    "scenes": [
      "showcase"
    ],
    "fx": ""
  },
  {
    "id": "geist",
    "mesh": "SM_Geist",
    "xOffset": -0.083,
    "yOffset": 0,
    "xRotationOffset": 0,
    "sizeTarget": 0.34,
    "scenes": [
      "showcase"
    ],
    "fx": ""
  },
  {
    "id": "kiss-bag",
    "mesh": "SM_KissBag",
    "xOffset": -0.089,
    "yOffset": -0.04,
    "xRotationOffset": 0,
    "sizeTarget": 0.25,
    "scenes": [
      "showcase"
    ],
    "fx": ""
  },
  {
    "id": "webby-kidsuper",
    "mesh": "SM_WebbyKidSuper",
    "xOffset": -0.167,
    "yOffset": 0,
    "xRotationOffset": 0.23,
    "sizeTarget": 0.624,
    "scenes": [
      "services"
    ],
    "fx": ""
  },
  {
    "id": "sotd-01",
    "mesh": "SM_SOTD_01",
    "xOffset": -0.167,
    "yOffset": 0,
    "xRotationOffset": 0,
    "sizeTarget": 0.67,
    "scenes": [
      "services"
    ],
    "fx": ""
  },
  {
    "id": "pink-floyd",
    "mesh": "SM_PinkFloyd",
    "xOffset": -0.163,
    "yOffset": 0,
    "xRotationOffset": 0,
    "sizeTarget": 0.46,
    "scenes": [
      "services"
    ],
    "fx": ""
  },
  {
    "id": "dl-frame",
    "mesh": "DL_Frame",
    "xOffset": -0.085,
    "yOffset": 0,
    "xRotationOffset": 0,
    "sizeTarget": 0.3,
    "scenes": [
      "showcase"
    ],
    "fx": ""
  },
  {
    "id": "webby-mrbeast",
    "mesh": "SM_WebbyMrBeast",
    "xOffset": -0.167,
    "yOffset": 0,
    "xRotationOffset": 0.23,
    "sizeTarget": 0.624,
    "scenes": [
      "services"
    ],
    "fx": ""
  },
  {
    "id": "patas",
    "mesh": "SM_Patas",
    "xOffset": -0.175,
    "yOffset": 0,
    "xRotationOffset": 0,
    "sizeTarget": 0.4956,
    "scenes": [
      "services"
    ],
    "fx": ""
  },
  {
    "id": "sm-07-02",
    "mesh": "SM_07_02",
    "xOffset": -0.115,
    "yOffset": 0,
    "xRotationOffset": 0,
    "sizeTarget": 0.4,
    "scenes": [
      "blog"
    ],
    "fx": ""
  },
  {
    "id": "coffee",
    "mesh": "Coffee",
    "xOffset": -0.135,
    "yOffset": -0.055,
    "xRotationOffset": 0,
    "sizeTarget": 0.48,
    "scenes": [
      "blog"
    ],
    "fx": ""
  },
  {
    "id": "sm-06-06",
    "mesh": "SM_06_06",
    "xOffset": -0.125,
    "yOffset": 0,
    "xRotationOffset": 0,
    "sizeTarget": 0.28,
    "scenes": [
      "blog"
    ],
    "fx": ""
  },
  {
    "id": "vercel-ship-2324",
    "mesh": "SM_VercelShip2324",
    "xOffset": -0.083,
    "yOffset": 0,
    "xRotationOffset": 0,
    "sizeTarget": 0.34,
    "scenes": [
      "showcase"
    ],
    "fx": ""
  },
  {
    "id": "edglrd",
    "mesh": "SM_EDGLRD",
    "xOffset": -0.083,
    "yOffset": 0,
    "xRotationOffset": 0,
    "sizeTarget": 0.3,
    "scenes": [
      "showcase"
    ],
    "fx": ""
  },
  {
    "id": "vc-ship",
    "mesh": "SM_VCShip",
    "xOffset": -0.083,
    "yOffset": 0,
    "xRotationOffset": 0,
    "sizeTarget": 0.3,
    "scenes": [
      "showcase"
    ],
    "fx": ""
  },
  {
    "id": "sotd-02",
    "mesh": "SM_SOTD_02",
    "xOffset": -0.167,
    "yOffset": 0,
    "xRotationOffset": 0,
    "sizeTarget": 0.67,
    "scenes": [
      "services"
    ],
    "fx": ""
  },
  {
    "id": "mate",
    "mesh": "SM_Mate",
    "xOffset": -0.185,
    "yOffset": -0.1,
    "xRotationOffset": 0.23,
    "sizeTarget": 0.6,
    "scenes": [
      "people"
    ],
    "fx": ""
  },
  {
    "id": "termo",
    "mesh": "SM_Termo",
    "xOffset": -0.177,
    "yOffset": 0,
    "xRotationOffset": 0.23,
    "sizeTarget": 0.65,
    "scenes": [
      "people"
    ],
    "fx": ""
  },
  {
    "id": "nextjs",
    "mesh": "SM_Nextjs",
    "xOffset": -0.089,
    "yOffset": 0.03,
    "xRotationOffset": 0,
    "sizeTarget": 0.35,
    "scenes": [
      "showcase"
    ],
    "fx": ""
  }
]
