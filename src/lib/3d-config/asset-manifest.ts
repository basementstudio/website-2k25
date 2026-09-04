// Source of truth for repo-local 3D asset URLs and mesh refs. Hand-edited.
// Editable copy (inspectable text, scene cameras/postprocessing/tabs, physics)
// lives in Sanity Studio under "3D Config" — see fetch-3d-config-sanity.ts.
// Per-inspectable mesh metadata lives in ./inspectables-meta.ts.
//
// See ./README.md for how to update.

import type { AssetsResult } from "@/components/assets-provider/fetch-assets"

export type AssetsBase = Omit<
  AssetsResult,
  "inspectables" | "scenes" | "physicsParams"
>

export const ASSETS_BASE: AssetsBase = {
  // --- Map models ---
  officeItems: "/3d/models/officeItems-aef75712.glb",
  office: "/3d/models/office-b55484c8.glb",
  officeWireframe: "/3d/models/officeWireframe-d770f1ee.glb",
  outdoor: "/3d/models/outdoor-6ead65cf.glb",
  godrays: "/3d/models/godrays-f4cbda2b.glb",
  basketball: "/3d/models/basketball-4a3976f2.glb",
  basketballNet: "/3d/models/basketballNet-528bd868.glb",
  contactPhone: "/3d/models/contactPhone-4c98003c.glb",
  routingElements: "/3d/models/routingElements-dbc4fd71.glb",
  outdoorCars: "/3d/models/outdoorCars-d9030620.glb",

  // --- Map textures ---
  mapTextures: {
    rain: "/3d/textures/mapTextures-rain-d1b1ba0b.jpg",
    basketballVa: "/3d/textures/mapTextures-basketballVa-f77e5faf.exr"
  },

  // --- Special events ---
  specialEvents: {
    christmas: {
      tree: "/3d/models/christmas-tree-50bcb465.glb",
      song: "/3d/audio/christmas-song-9ecee706.mp3"
    }
  },

  // --- Lightmap atlas (merge-by-material pipeline) ---
  // The new office.glb export tags almost every mesh with a "Lightmap"
  // custom property (read at runtime as mesh.userData.Lightmap) instead of
  // the hand-maintained name lists below. "Map00" is this shared atlas —
  // see bakes.tsx. The old bakes[] array stays for files not migrated yet
  // (e.g. officeItems.glb) and doesn't need to list Map00 meshes anymore.
  //
  // KTX2 (Basis UASTC HDR) is being trialed as a replacement for the EXR —
  // much smaller, and three.js's KTX2Loader already transcodes to BC6H /
  // uncompressed half-float on devices without native ASTC-HDR, so no
  // custom fallback needed. bakes.tsx currently loads the .ktx2 field; the
  // .exr field is kept wired here (not orphaned) as a one-line revert if the
  // KTX2 path looks wrong — flip USE_KTX2_LIGHTMAPS in bakes.tsx back to
  // false, don't need to touch this file.
  lightmapAtlas: "/3d/textures/lightmap-atlas-52dbdb4b.exr",
  lightmapAtlasKtx2: "/3d/textures/lightmap-atlas-c58eb9fa.ktx2",

  // --- Bakes (lightmaps + AO) — legacy per-zone system, now fully retired ---
  // Every mesh every one of these 18 groups used to target has since been
  // merged into a Map00-tagged batch mesh (bakes.tsx's atlas traversal picks
  // those up directly via userData.Lightmap) or, for the one exception
  // (SM_06_01, tagged "blog"), is handled exclusively by lamp/index.tsx.
  // Verified via scripts/3d-assets — every mesh name in the old groups now
  // either doesn't exist anywhere, or exists only as the merged batch that
  // already carries Lightmap:"Map00", meaning the atlas write already wins
  // (bakes.tsx runs the atlas traversal after this array, last-write-wins) —
  // these EXR/AO fetches were pure dead weight, never visibly applied.
  // Keep this array's shape (still Bake[]) for whichever future glb needs a
  // real per-zone bake again — just don't leave dead entries in it.
  bakes: [],

  // --- Matcaps ---
  matcaps: [
    {
      mesh: "SM_SOTD_Glass",
      file: "/3d/textures/matcap-SM_SOTD_Glass-dffa5eb9.webp",
      isGlass: true
    },
    {
      mesh: "SM_SOTD_Glass_02",
      file: "/3d/textures/matcap-SM_SOTD_Glass_02-dffa5eb9.webp",
      isGlass: true
    },
    {
      mesh: "SM_ScreenPatas_Glass",
      file: "/3d/textures/matcap-SM_ScreenPatas_Glass-dffa5eb9.webp",
      isGlass: true
    },
    {
      mesh: "SM_WebbyMrBeast",
      file: "/3d/textures/matcap-SM_WebbyMrBeast-4e664cc8.webp",
      isGlass: false
    },
    {
      mesh: "SM_WebbyKidSuper",
      file: "/3d/textures/matcap-SM_WebbyKidSuper-4e664cc8.webp",
      isGlass: false
    },
    {
      mesh: "SM_07_02",
      file: "/3d/textures/matcap-SM_07_02-4e664cc8.webp",
      isGlass: false
    },
    {
      mesh: "SM_MateMetallic",
      file: "/3d/textures/matcap-SM_MateMetallic-4e664cc8.webp",
      isGlass: false
    },
    {
      mesh: "SM_TermoMetallic",
      file: "/3d/textures/matcap-SM_TermoMetallic-4e664cc8.webp",
      isGlass: false
    },
    {
      mesh: "SM_VercelShipGlass",
      file: "/3d/textures/matcap-SM_VercelShipGlass-e33b0ff5.webp",
      isGlass: true
    },
    {
      mesh: "SM_VercelGeistGlass",
      file: "/3d/textures/matcap-SM_VercelGeistGlass-e33b0ff5.webp",
      isGlass: true
    },
    {
      mesh: "SM_EDGLRD",
      file: "/3d/textures/matcap-SM_EDGLRD-4e664cc8.webp",
      isGlass: false
    },
    {
      mesh: "SM_KissBag_METAL",
      file: "/3d/textures/matcap-SM_KissBag_METAL-4e664cc8.webp",
      isGlass: false
    },
    {
      mesh: "SM_MrBeast",
      file: "/3d/textures/matcap-SM_MrBeast-4e664cc8.webp",
      isGlass: false
    },
    {
      mesh: "SM_Nextjs",
      file: "/3d/textures/matcap-SM_Nextjs-c8ecd274.jpg",
      isGlass: false
    },
    {
      mesh: "SM_NextjsMetallic",
      file: "/3d/textures/matcap-SM_NextjsMetallic-4e664cc8.webp",
      isGlass: false
    }
  ],

  // --- Glass / double-side material lists ---
  glassMaterials: ["BSM_MTL_Glass", "MTL_Backup", "MTL_LightBox"],
  doubleSideElements: [
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
  glassReflexes: [
    {
      mesh: "SM_PB_Glass2_4",
      url: "/3d/textures/reflex-SM_PB_Glass2_4-a1569408.webp"
    }
  ],

  // --- Arcade ---
  arcade: {
    idleScreen: "/3d/textures/arcade-idleScreen-7c248ce4.mp4",
    placeholderLab: "/3d/textures/arcade-placeholderLab-501eef8a.png",
    boot: "/3d/textures/arcade-boot-decd8d60.png",
    shaderLab: "/3d/textures/arcade-shader-lab.png",
    chronicles: "/3d/textures/arcade-chronicles.png",
    looper: "/3d/textures/arcade-looper.png",
    palm: "/3d/textures/arcade-palm-67ee623c.png",
    skybox: "/3d/textures/arcade-skybox-f8dd9185.webp",
    cityscape: "/3d/textures/arcade-cityscape-bdf3692b.png",
    introScreen: "/3d/textures/arcade-introScreen-4c437c4d.jpg"
  },

  // --- Videos ---
  videos: [
    {
      mesh: "SM_TvScreen_1",
      url: "/3d/video/video-SM_TvScreen_1-7ab9d38c.mp4",
      intensity: 18
    },
    {
      mesh: "DL_Screen",
      url: "/3d/video/video-DL_Screen-413df502.mp4",
      intensity: 18
    },
    {
      mesh: "SM_OBJ001",
      url: "/3d/video/video-SM_OBJ001-774b0433.mp4",
      intensity: 18
    },
    {
      mesh: "SM_ScreenPatas",
      url: "/3d/video/video-SM_ScreenPatas-1e8af958.mp4",
      intensity: 18
    },
    {
      mesh: "SM_PeopleMonitorA",
      url: "/3d/video/video-SM_PeopleMonitorA-24a379df.mp4",
      intensity: 18
    },
    {
      mesh: "SM_PeopleMonitorD",
      url: "/3d/video/video-SM_PeopleMonitorD-3d411157.mp4",
      intensity: 18
    }
  ],

  // --- SFX (audio) ---
  sfx: {
    basketballTheme: "/3d/audio/sfx-basketballTheme-1e7bf737.mp3",
    basketballSwoosh: "/3d/audio/sfx-basketballSwoosh-a8d6fe6e.mp3",
    basketballNet: "/3d/audio/sfx-basketballNet-0e3aeb31.mp3",
    basketballThump: "/3d/audio/sfx-basketballThump-a788eb90.mp3",
    basketballBuzzer: "/3d/audio/sfx-basketballBuzzer-641ca6b0.mp3",
    basketballStreak: "/3d/audio/sfx-basketballStreak-15218f70.mp3",
    knobTurning: "/3d/audio/sfx-knobTurning-49a3692d.mp3",
    antenna: "/3d/audio/sfx-antenna-0bd5f9e1.mp3",
    blog: {
      lockedDoor: [
        "/3d/audio/sfx-blog-lockedDoor-0-388fbad0.mp3",
        "/3d/audio/sfx-blog-lockedDoor-1-57cfd932.mp3"
      ],
      door: [
        {
          open: "/3d/audio/sfx-blog-door-0-open-d8338e97.mp3",
          close: "/3d/audio/sfx-blog-door-0-close-26471675.mp3"
        },
        {
          open: "/3d/audio/sfx-blog-door-1-open-dd47b175.mp3",
          close: "/3d/audio/sfx-blog-door-1-close-3e062566.mp3"
        },
        {
          open: "/3d/audio/sfx-blog-door-2-open-05dad2ef.mp3",
          close: "/3d/audio/sfx-blog-door-2-close-69f09d3c.mp3"
        }
      ],
      lamp: [
        {
          pull: "/3d/audio/sfx-blog-lamp-0-pull-649b6e28.mp3",
          release: "/3d/audio/sfx-blog-lamp-0-release-c9405a44.mp3"
        },
        {
          pull: "/3d/audio/sfx-blog-lamp-1-pull-7f5277b5.mp3",
          release: "/3d/audio/sfx-blog-lamp-1-release-0ba43b37.mp3"
        }
      ]
    },
    arcade: {
      buttons: [
        {
          press: "/3d/audio/sfx-arcade-button-0-press-3ce420fa.mp3",
          release: "/3d/audio/sfx-arcade-button-0-release-b509a45e.mp3"
        },
        {
          press: "/3d/audio/sfx-arcade-button-1-press-f5c1a0d9.mp3",
          release: "/3d/audio/sfx-arcade-button-1-release-81099ed8.mp3"
        },
        {
          press: "/3d/audio/sfx-arcade-button-2-press-ea4eee5a.mp3",
          release: "/3d/audio/sfx-arcade-button-2-release-6a77ad14.mp3"
        },
        {
          press: "/3d/audio/sfx-arcade-button-3-press-6fbaedcd.mp3",
          release: "/3d/audio/sfx-arcade-button-3-release-42ff68cb.mp3"
        }
      ],
      sticks: [
        {
          press: "/3d/audio/sfx-arcade-stick-0-press-dc73ac08.mp3",
          release: "/3d/audio/sfx-arcade-stick-0-release-004984d2.mp3"
        },
        {
          press: "/3d/audio/sfx-arcade-stick-1-press-efde8856.mp3",
          release: "/3d/audio/sfx-arcade-stick-1-release-3d9ec762.mp3"
        },
        {
          press: "/3d/audio/sfx-arcade-stick-2-press-a2dee58f.mp3",
          release: "/3d/audio/sfx-arcade-stick-2-release-80263473.mp3"
        },
        {
          press: "/3d/audio/sfx-arcade-stick-3-press-17ac3989.mp3",
          release: "/3d/audio/sfx-arcade-stick-3-release-588dbb0c.mp3"
        },
        {
          press: "/3d/audio/sfx-arcade-stick-4-press-287bd514.mp3",
          release: "/3d/audio/sfx-arcade-stick-4-release-159ff115.mp3"
        }
      ],
      miamiHeatwave: "/3d/audio/sfx-arcade-miamiHeatwave-1305ed0f.mp3"
    },
    music: {
      aqua: "/3d/audio/sfx-music-aqua-8bc13cdb.mp3",
      rain: "/3d/audio/sfx-music-rain-5cc24dda.mp3",
      tiger: "/3d/audio/sfx-music-tiger-5dba3c0c.mp3",
      vhs: "/3d/audio/sfx-music-vhs-79ccc470.mp3"
    },
    contact: {
      interference: "/3d/audio/sfx-contact-interference-f417008f.mp3"
    }
  },

  // --- Characters ---
  characters: {
    model: "/3d/models/character-model-daed86d4.glb",
    textureBody: "/3d/textures/character-body-a791b664.webp",
    textureFaces: "/3d/textures/character-faces-3f09fa28.webp",
    textureArms: "/3d/textures/character-arms-de19ba86.png",
    textureComic: "/3d/textures/character-comic-5b7b0e61.jpg"
  },

  // --- Pets ---
  pets: {
    model: "/3d/models/pet-model-6725223c.glb",
    pureTexture: "/3d/textures/pet-pure-7cb58bcc.webp",
    bostonTexture: "/3d/textures/pet-boston-0edf2bad.webp"
  },

  // --- Lamp ---
  // Two dedicated bakes for the lamp's on/off state (Map01 / Map01-off in
  // Blender) — replaces the old single extraLightmap + shared-atlas-fallback
  // scheme, since the lamp-affected meshes (Lightmap: "Map01") don't carry
  // the atlas UV set at all. lamp/index.tsx assigns extraLightmap to
  // lampLightmap and extraLightmapOff to lightMap; lightLampEnabled (already
  // wired) toggles between the two.
  lamp: {
    extraLightmap: "/3d/textures/lamp-extraLightmap-blog-on-f351ce6b.exr",
    extraLightmapOff: "/3d/textures/lamp-extraLightmap-blog-off-b828b18e.exr",
    extraLightmapKtx2: "/3d/textures/lamp-extraLightmap-blog-on-1c6f69e3.ktx2",
    extraLightmapOffKtx2:
      "/3d/textures/lamp-extraLightmap-blog-off-aa00bcce.ktx2"
  }
}

export type { InspectableMeta } from "./inspectables-meta"
export { INSPECTABLES_META } from "./inspectables-meta"
