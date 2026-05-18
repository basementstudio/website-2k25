// TS-side per-inspectable metadata: mesh, offsets, sizeTarget, scenes, fx URL.
// Editor-facing fields (title / specs / description) live in Sanity as
// inspectableContent docs and are joined by id in fetch-assets-local.ts.
//
// See ./README.md for how to add or edit inspectables.

export interface InspectableMeta {
  id: string
  mesh: string
  xOffset: number
  yOffset: number
  xRotationOffset: number
  sizeTarget: number
  scenes: string[]
  fx: string
}

export const INSPECTABLES_META: InspectableMeta[] = [
  {
    "id": "tH0vuwpFm76CA7YIWjIcz",
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
    "id": "scYVhruaQ3SsNxFzJyjoH",
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
    "id": "NXspTP94KjQh1rlidUDPY",
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
    "id": "JZ854uh5MqhJqY0pKTeiN",
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
    "id": "dYsnLwbvAoE209wooWk8T",
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
    "id": "0kSqAFdHtWohWIy3Q4NN1",
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
    "id": "sSDgDYA5LsZZ8cAZ43Wip",
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
    "id": "IFQyFPQ5qobl9v5SLFio8",
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
    "id": "k1S5Qs4ly2LYFoT2WQE1b",
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
    "id": "kOxJNnElEt5BaqE16LXeH",
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
    "id": "S16Q7c7hsUk5wkZ4xjoJm",
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
    "id": "aXR41L625xAuBjBzoN0uM",
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
    "id": "PwAtsWnz9EUUkCPFh0OFU",
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
    "id": "wdP9k4bS0wleG29nnULIz",
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
    "id": "lFBwB2ocWiE7ZyueU3r6q",
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
    "id": "1GaM4pVdFwPXoXnFzkrjU",
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
    "id": "j1nWSK1FENmTbdqGFCNAJ",
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
    "id": "UQyTb5DoHzOoDwgYcSDnh",
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
    "id": "QYZUT0mYc7TtDL67BPF7z",
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
    "id": "gOHRIi7YaIBbxhus2Rixh",
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
