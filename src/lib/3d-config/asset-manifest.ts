// Source of truth for repo-local 3D asset URLs and mesh refs. Hand-edited.
// Editable copy (inspectable text, scene cameras/postprocessing/tabs, physics)
// lives in Sanity Studio under "3D Config" — see fetch-3d-config-sanity.ts.
// Per-inspectable mesh metadata lives in ./inspectables-meta.ts.
//
// See ./README.md for how to update.

import type { AssetsResult } from "@/components/assets-provider/fetch-assets"

export type AssetsBase = Omit<AssetsResult, "inspectables" | "scenes" | "physicsParams">

export const ASSETS_BASE: AssetsBase = {

  // --- Map models ---
  "officeItems": "/3d/models/officeItems-9a8576ca.glb",
  "office": "/3d/models/office-077b4007.glb",
  "officeWireframe": "/3d/models/officeWireframe-d770f1ee.glb",
  "outdoor": "/3d/models/outdoor-6ead65cf.glb",
  "godrays": "/3d/models/godrays-f4cbda2b.glb",
  "basketball": "/3d/models/basketball-4a3976f2.glb",
  "basketballNet": "/3d/models/basketballNet-528bd868.glb",
  "contactPhone": "/3d/models/contactPhone-4c98003c.glb",
  "routingElements": "/3d/models/routingElements-dbc4fd71.glb",
  "outdoorCars": "/3d/models/outdoorCars-d9030620.glb",

  // --- Map textures ---
  "mapTextures": {
    "rain": "/3d/textures/mapTextures-rain-d1b1ba0b.jpg",
    "basketballVa": "/3d/textures/mapTextures-basketballVa-f77e5faf.exr"
  },

  // --- Special events ---
  "specialEvents": {
    "christmas": {
      "tree": "/3d/models/christmas-tree-50bcb465.glb",
      "song": "/3d/audio/christmas-song-9ecee706.mp3"
    }
  },

  // --- Bakes (lightmaps + AO) ---
  "bakes": [
    {
      "title": "00",
      "lightmap": "/3d/textures/bake-00-lightmap-d25dcd28.exr",
      "ambientOcclusion": "/3d/textures/bake-00-ao-8c56cc34.jpg",
      "meshes": [
        "SM_00_000",
        "SM_00_001",
        "SM_00_002",
        "SM_00_003",
        "SM_00_004",
        "SM_00_005",
        "SM_00_006",
        "SM_00_007",
        "SM_00_008",
        "SM_00_009",
        "SM_00_010",
        "SM_00_011",
        "SM_00_012"
      ]
    },
    {
      "title": "00a",
      "lightmap": "/3d/textures/bake-00a-lightmap-54a80c69.exr",
      "ambientOcclusion": "",
      "meshes": [
        "SM_00a_00",
        "SM_00a_01",
        "SM_00a_02",
        "SM_00a_03",
        "SM_CatTail",
        "SM_KitCat_1",
        "SM_KitCat_2"
      ]
    },
    {
      "title": "01",
      "lightmap": "/3d/textures/bake-01-lightmap-0c3d5e5b.exr",
      "ambientOcclusion": "/3d/textures/bake-01-ao-e448b3e7.jpg",
      "meshes": [
        "SM_01_1",
        "SM_01_2",
        "SM_01_3",
        "SM_01_4"
      ]
    },
    {
      "title": "02",
      "lightmap": "/3d/textures/bake-02-lightmap-5229a667.exr",
      "ambientOcclusion": "/3d/textures/bake-02-ao-f8901563.jpg",
      "meshes": [
        "02_BT_1",
        "02_BT_2",
        "02_BT_3",
        "02_BT_4",
        "02_BT_5",
        "02_BT_6",
        "02_BT_7",
        "02_BT_8",
        "02_BT_9",
        "02_BT_10",
        "02_BT_11",
        "02_BT_12",
        "02_BT_13",
        "02_BT_14",
        "02_JYTK_L",
        "02_JYTK_R",
        "02_Map",
        "02_Arcade_B"
      ]
    },
    {
      "title": "2A",
      "lightmap": "/3d/textures/bake-2A-lightmap-ab95e2e7.exr",
      "ambientOcclusion": "/3d/textures/bake-2A-ao-b3d5aa21.jpg",
      "meshes": [
        "02_Arcade_A"
      ]
    },
    {
      "title": "03",
      "lightmap": "/3d/textures/bake-03-lightmap-39b70852.exr",
      "ambientOcclusion": "/3d/textures/bake-03-ao-65209297.jpg",
      "meshes": [
        "SM_03_00",
        "SM_03_01",
        "SM_03_02",
        "SM_03_03",
        "SM_03_04",
        "SM_03_05",
        "SM_03_06",
        "SM_03_07"
      ]
    },
    {
      "title": "04",
      "lightmap": "/3d/textures/bake-04-lightmap-bf25f6d3.exr",
      "ambientOcclusion": "/3d/textures/bake-04-ao-4af56635.jpg",
      "meshes": [
        "SM_04_1",
        "SM_04_2",
        "SM_04_3",
        "SM_04_4",
        "SM_04_5",
        "SM_04_6",
        "SM_04_7",
        "SM_04_8",
        "SM_04_9"
      ]
    },
    {
      "title": "05",
      "lightmap": "/3d/textures/bake-05-lightmap-4b8caf70.exr",
      "ambientOcclusion": "",
      "meshes": [
        "SM_05_00",
        "SM_05_01"
      ]
    },
    {
      "title": "06",
      "lightmap": "/3d/textures/bake-06-lightmap-4138fa1d.exr",
      "ambientOcclusion": "/3d/textures/bake-06-ao-cb146198.jpg",
      "meshes": [
        "SM_06_01",
        "SM_06_02",
        "SM_06_03",
        "SM_06_04",
        "SM_06_05",
        "SM_06_06",
        "SM_06_07"
      ]
    },
    {
      "title": "07",
      "lightmap": "/3d/textures/bake-07-lightmap-d1e16b0e.exr",
      "ambientOcclusion": "/3d/textures/bake-07-ao-28c990e3.jpg",
      "meshes": [
        "SM_07_01",
        "SM_07_02"
      ]
    },
    {
      "title": "SM_library_Wood",
      "lightmap": "/3d/textures/bake-SM_library_Wood-lightmap-cc9a19f1.exr",
      "ambientOcclusion": "/3d/textures/bake-SM_library_Wood-ao-fd6bcdee.jpg",
      "meshes": [
        "SM_library_Wood"
      ]
    },
    {
      "title": "SM_LibraryWall_01",
      "lightmap": "/3d/textures/bake-SM_LibraryWall_01-lightmap-4ad5fb0a.exr",
      "ambientOcclusion": "/3d/textures/bake-SM_LibraryWall_01-ao-04a99bf7.jpg",
      "meshes": [
        "SM_LibraryWall_01"
      ]
    },
    {
      "title": "SM_Roof",
      "lightmap": "/3d/textures/bake-SM_Roof-lightmap-c3612eab.exr",
      "ambientOcclusion": "",
      "meshes": [
        "SM_Roof"
      ]
    },
    {
      "title": "SM_RoofMetallic",
      "lightmap": "/3d/textures/bake-SM_RoofMetallic-lightmap-a66cad57.exr",
      "ambientOcclusion": "",
      "meshes": [
        "SM_RoofMetallic"
      ]
    },
    {
      "title": "ServicesModels",
      "lightmap": "/3d/textures/bake-ServicesModels-lightmap-2d6c7f1f.exr",
      "ambientOcclusion": "",
      "meshes": [
        "SM_PinkFloyd",
        "SM_SOTD_01",
        "SM_Patas",
        "SM_WebbyKidSuper",
        "SM_WebbyMrBeast"
      ]
    },
    {
      "title": "Showcase Models",
      "lightmap": "/3d/textures/bake-Showcase_Models-lightmap-5c55c3ff.exr",
      "ambientOcclusion": "",
      "meshes": [
        "DL_Frame",
        "SM_EDGLRD",
        "SM_Geist",
        "SM_KissBag",
        "SM_Swaggersouls",
        "SM_VercelShip2324",
        "SM_MrBeast"
      ]
    },
    {
      "title": "People_Tables",
      "lightmap": "/3d/textures/bake-People_Tables-lightmap-40bb462b.exr",
      "ambientOcclusion": "/3d/textures/bake-People_Tables-ao-964c430b.jpg",
      "meshes": [
        "SM_05_02"
      ]
    },
    {
      "title": "Chairs",
      "lightmap": "/3d/textures/bake-Chairs-lightmap-96e878de.exr",
      "ambientOcclusion": "",
      "meshes": [
        "SM_05_03"
      ]
    }
  ],

  // --- Matcaps ---
  "matcaps": [
    {
      "mesh": "SM_SOTD_Glass",
      "file": "/3d/textures/matcap-SM_SOTD_Glass-dffa5eb9.webp",
      "isGlass": true
    },
    {
      "mesh": "SM_SOTD_Glass_02",
      "file": "/3d/textures/matcap-SM_SOTD_Glass_02-dffa5eb9.webp",
      "isGlass": true
    },
    {
      "mesh": "SM_ScreenPatas_Glass",
      "file": "/3d/textures/matcap-SM_ScreenPatas_Glass-dffa5eb9.webp",
      "isGlass": true
    },
    {
      "mesh": "SM_WebbyMrBeast",
      "file": "/3d/textures/matcap-SM_WebbyMrBeast-4e664cc8.webp",
      "isGlass": false
    },
    {
      "mesh": "SM_WebbyKidSuper",
      "file": "/3d/textures/matcap-SM_WebbyKidSuper-4e664cc8.webp",
      "isGlass": false
    },
    {
      "mesh": "SM_07_02",
      "file": "/3d/textures/matcap-SM_07_02-4e664cc8.webp",
      "isGlass": false
    },
    {
      "mesh": "SM_MateMetallic",
      "file": "/3d/textures/matcap-SM_MateMetallic-4e664cc8.webp",
      "isGlass": false
    },
    {
      "mesh": "SM_TermoMetallic",
      "file": "/3d/textures/matcap-SM_TermoMetallic-4e664cc8.webp",
      "isGlass": false
    },
    {
      "mesh": "SM_VercelShipGlass",
      "file": "/3d/textures/matcap-SM_VercelShipGlass-e33b0ff5.webp",
      "isGlass": true
    },
    {
      "mesh": "SM_VercelGeistGlass",
      "file": "/3d/textures/matcap-SM_VercelGeistGlass-e33b0ff5.webp",
      "isGlass": true
    },
    {
      "mesh": "SM_EDGLRD",
      "file": "/3d/textures/matcap-SM_EDGLRD-4e664cc8.webp",
      "isGlass": false
    },
    {
      "mesh": "SM_KissBag_METAL",
      "file": "/3d/textures/matcap-SM_KissBag_METAL-4e664cc8.webp",
      "isGlass": false
    },
    {
      "mesh": "SM_MrBeast",
      "file": "/3d/textures/matcap-SM_MrBeast-4e664cc8.webp",
      "isGlass": false
    },
    {
      "mesh": "SM_Nextjs",
      "file": "/3d/textures/matcap-SM_Nextjs-c8ecd274.jpg",
      "isGlass": false
    },
    {
      "mesh": "SM_NextjsMetallic",
      "file": "/3d/textures/matcap-SM_NextjsMetallic-4e664cc8.webp",
      "isGlass": false
    }
  ],

  // --- Glass / double-side material lists ---
  "glassMaterials": [
    "BSM_MTL_Glass",
    "MTL_Backup",
    "MTL_LightBox"
  ],
  "doubleSideElements": [
    "SM_LightMeshGeneral",
    "SM_00a_01",
    "Cube001",
    "Cylinder",
    "Signal",
    "SM_LightMeshBlog",
    "SM_05_03002",
    "SM_04_8",
    "TX_board3",
    "SM_BasketballGlass",
    "cloudy_01",
    "SM_NextjsBelt",
    "SM_NextJSText"
  ],
  "glassReflexes": [
    {
      "mesh": "SM_PB_Glass2_4",
      "url": "/3d/textures/reflex-SM_PB_Glass2_4-a1569408.webp"
    }
  ],

  // --- Arcade ---
  "arcade": {
    "idleScreen": "/3d/textures/arcade-idleScreen-7c248ce4.mp4",
    "placeholderLab": "/3d/textures/arcade-placeholderLab-501eef8a.png",
    "boot": "/3d/textures/arcade-boot-decd8d60.png",
    "chronicles": "/3d/textures/arcade-chronicles-e59b693b.png",
    "looper": "/3d/textures/arcade-looper-7a440b5c.png",
    "palm": "/3d/textures/arcade-palm-67ee623c.png",
    "skybox": "/3d/textures/arcade-skybox-f8dd9185.webp",
    "cityscape": "/3d/textures/arcade-cityscape-bdf3692b.png",
    "introScreen": "/3d/textures/arcade-introScreen-4c437c4d.jpg"
  },

  // --- Videos ---
  "videos": [
    {
      "mesh": "SM_TvScreen_1",
      "url": "/3d/video/video-SM_TvScreen_1-7ab9d38c.mp4",
      "intensity": 18
    },
    {
      "mesh": "DL_Screen",
      "url": "/3d/video/video-DL_Screen-413df502.mp4",
      "intensity": 18
    },
    {
      "mesh": "SM_OBJ001",
      "url": "/3d/video/video-SM_OBJ001-774b0433.mp4",
      "intensity": 18
    },
    {
      "mesh": "SM_ScreenPatas",
      "url": "/3d/video/video-SM_ScreenPatas-1e8af958.mp4",
      "intensity": 18
    },
    {
      "mesh": "SM_PeopleMonitorA",
      "url": "/3d/video/video-SM_PeopleMonitorA-24a379df.mp4",
      "intensity": 18
    },
    {
      "mesh": "SM_PeopleMonitorD",
      "url": "/3d/video/video-SM_PeopleMonitorD-3d411157.mp4",
      "intensity": 18
    }
  ],

  // --- SFX (audio) ---
  "sfx": {
    "basketballTheme": "/3d/audio/sfx-basketballTheme-1e7bf737.mp3",
    "basketballSwoosh": "/3d/audio/sfx-basketballSwoosh-a8d6fe6e.mp3",
    "basketballNet": "/3d/audio/sfx-basketballNet-0e3aeb31.mp3",
    "basketballThump": "/3d/audio/sfx-basketballThump-a788eb90.mp3",
    "basketballBuzzer": "/3d/audio/sfx-basketballBuzzer-641ca6b0.mp3",
    "basketballStreak": "/3d/audio/sfx-basketballStreak-15218f70.mp3",
    "knobTurning": "/3d/audio/sfx-knobTurning-49a3692d.mp3",
    "antenna": "/3d/audio/sfx-antenna-0bd5f9e1.mp3",
    "blog": {
      "lockedDoor": [
        "/3d/audio/sfx-blog-lockedDoor-0-388fbad0.mp3",
        "/3d/audio/sfx-blog-lockedDoor-1-57cfd932.mp3"
      ],
      "door": [
        {
          "open": "/3d/audio/sfx-blog-door-0-open-d8338e97.mp3",
          "close": "/3d/audio/sfx-blog-door-0-close-26471675.mp3"
        },
        {
          "open": "/3d/audio/sfx-blog-door-1-open-dd47b175.mp3",
          "close": "/3d/audio/sfx-blog-door-1-close-3e062566.mp3"
        },
        {
          "open": "/3d/audio/sfx-blog-door-2-open-05dad2ef.mp3",
          "close": "/3d/audio/sfx-blog-door-2-close-69f09d3c.mp3"
        }
      ],
      "lamp": [
        {
          "pull": "/3d/audio/sfx-blog-lamp-0-pull-649b6e28.mp3",
          "release": "/3d/audio/sfx-blog-lamp-0-release-c9405a44.mp3"
        },
        {
          "pull": "/3d/audio/sfx-blog-lamp-1-pull-7f5277b5.mp3",
          "release": "/3d/audio/sfx-blog-lamp-1-release-0ba43b37.mp3"
        }
      ]
    },
    "arcade": {
      "buttons": [
        {
          "press": "/3d/audio/sfx-arcade-button-0-press-3ce420fa.mp3",
          "release": "/3d/audio/sfx-arcade-button-0-release-b509a45e.mp3"
        },
        {
          "press": "/3d/audio/sfx-arcade-button-1-press-f5c1a0d9.mp3",
          "release": "/3d/audio/sfx-arcade-button-1-release-81099ed8.mp3"
        },
        {
          "press": "/3d/audio/sfx-arcade-button-2-press-ea4eee5a.mp3",
          "release": "/3d/audio/sfx-arcade-button-2-release-6a77ad14.mp3"
        },
        {
          "press": "/3d/audio/sfx-arcade-button-3-press-6fbaedcd.mp3",
          "release": "/3d/audio/sfx-arcade-button-3-release-42ff68cb.mp3"
        }
      ],
      "sticks": [
        {
          "press": "/3d/audio/sfx-arcade-stick-0-press-dc73ac08.mp3",
          "release": "/3d/audio/sfx-arcade-stick-0-release-004984d2.mp3"
        },
        {
          "press": "/3d/audio/sfx-arcade-stick-1-press-efde8856.mp3",
          "release": "/3d/audio/sfx-arcade-stick-1-release-3d9ec762.mp3"
        },
        {
          "press": "/3d/audio/sfx-arcade-stick-2-press-a2dee58f.mp3",
          "release": "/3d/audio/sfx-arcade-stick-2-release-80263473.mp3"
        },
        {
          "press": "/3d/audio/sfx-arcade-stick-3-press-17ac3989.mp3",
          "release": "/3d/audio/sfx-arcade-stick-3-release-588dbb0c.mp3"
        },
        {
          "press": "/3d/audio/sfx-arcade-stick-4-press-287bd514.mp3",
          "release": "/3d/audio/sfx-arcade-stick-4-release-159ff115.mp3"
        }
      ],
      "miamiHeatwave": "/3d/audio/sfx-arcade-miamiHeatwave-1305ed0f.mp3"
    },
    "music": {
      "aqua": "/3d/audio/sfx-music-aqua-8bc13cdb.mp3",
      "rain": "/3d/audio/sfx-music-rain-5cc24dda.mp3",
      "tiger": "/3d/audio/sfx-music-tiger-5dba3c0c.mp3",
      "vhs": "/3d/audio/sfx-music-vhs-79ccc470.mp3"
    },
    "contact": {
      "interference": "/3d/audio/sfx-contact-interference-f417008f.mp3"
    }
  },

  // --- Characters ---
  "characters": {
    "model": "/3d/models/character-model-daed86d4.glb",
    "textureBody": "/3d/textures/character-body-a791b664.webp",
    "textureFaces": "/3d/textures/character-faces-3f09fa28.webp",
    "textureArms": "/3d/textures/character-arms-de19ba86.png",
    "textureComic": "/3d/textures/character-comic-5b7b0e61.jpg"
  },

  // --- Pets ---
  "pets": {
    "model": "/3d/models/pet-model-6725223c.glb",
    "pureTexture": "/3d/textures/pet-pure-7cb58bcc.webp",
    "bostonTexture": "/3d/textures/pet-boston-0edf2bad.webp"
  },

  // --- Lamp ---
  "lamp": {
    "extraLightmap": "/3d/textures/lamp-extraLightmap-70f32016.exr"
  }
}

export { INSPECTABLES_META } from "./inspectables-meta"
export type { InspectableMeta } from "./inspectables-meta"
