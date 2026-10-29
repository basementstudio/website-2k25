// Flat patches of the office the Halloween spiders crawl on, in three.js world
// space (Blender's office export, Y-up). Each spider lives on one patch and
// wanders inside it: `center` is the patch's middle, `normal` points away from
// the surface into the room, `tangent` is the patch's local U axis (V is
// normal × tangent) and `size` is its [U, V] extent. Keep patches clear of
// screens and furniture tops — spiders walk flat, they don't climb.
export interface SpiderSurface {
  name: string
  center: [number, number, number]
  normal: [number, number, number]
  tangent: [number, number, number]
  size: [number, number]
  count: number
}

export const SPIDER_SURFACES: SpiderSurface[] = [
  {
    name: "home-floor",
    // The left strip rises into the Services platform and stairs.
    center: [6.65, 0, -10.9],
    normal: [0, 1, 0],
    tangent: [1, 0, 0],
    size: [4, 4.6],
    count: 7
  },
  {
    // Above the TVs, around the neon logo.
    name: "home-back-wall",
    // Stay between the corridor opening and the wall's right edge.
    center: [8.3, 2.75, -14.58],
    normal: [0, 0, 1],
    tangent: [1, 0, 0],
    size: [1.8, 1.2],
    count: 3
  },
  {
    name: "lab-glass",
    center: [4.38, 2.2, -14.62],
    normal: [0, 0, 1],
    tangent: [1, 0, 0],
    size: [2.1, 1.8],
    count: 3
  },
  {
    name: "people-floor",
    center: [8, 3.73, -25.5],
    normal: [0, 1, 0],
    tangent: [1, 0, 0],
    size: [6, 4],
    count: 4
  },
  {
    // The wall the People camera looks straight at.
    name: "people-wall",
    // The right half of the old rectangle was an open passage.
    center: [7.5, 5.4, -22.4],
    normal: [0, 0, -1],
    tangent: [-1, 0, 0],
    size: [1, 1.5],
    count: 3
  },
  {
    // Poster wall on the People camera's left — above the frames, which
    // stick out far enough to hide anything crawling behind them.
    name: "people-posters",
    center: [13.1, 6.2, -25],
    normal: [-1, 0, 0],
    tangent: [0, 0, 1],
    size: [4, 1.6],
    count: 3
  },
  {
    // Poster wall behind the Blog sofa.
    name: "blog-posters",
    // Solid panel beside the Blog doorway, below the roof opening.
    center: [8.35, 5.65, -18.2],
    normal: [1, 0, 0],
    tangent: [0, 0, -1],
    size: [1, 1.05],
    count: 3
  },
  {
    name: "blog-floor",
    center: [11, 3.73, -19],
    normal: [0, 1, 0],
    tangent: [1, 0, 0],
    size: [2.4, 3.4],
    count: 3
  }
]

// Body length in world units — oversized on purpose so they read from the
// camera (a real house spider would be a couple of pixels).
export const SPIDER_SCALE: [min: number, max: number] = [0.075, 0.11]
// World units per second while walking, before the per-spider size factor.
export const SPIDER_SPEED: [min: number, max: number] = [0.35, 0.8]
export const SPIDER_FLEE_SPEED = 1.6
// How close (world units) the cursor's hit point on a patch has to get
// before a spider on it bolts.
export const SPIDER_FLEE_RADIUS = 0.55

// One indoor ghost takes occasional passages through Home and its corridor.
// Uniform scale preserves the authored cloth proportions at 1.75 m tall.
export const GHOSTS = [
  // Keep a single indoor ghost in Home.
  {
    height: 1.75,
    seed: 0.13
  }
] as const satisfies readonly {
  height: number
  seed: number
}[]

// Ghosts drifting down the street out front (seen through the Services
// windows): each crosses x from → to at `speed` units/s, then waits `wait`
// seconds off-screen. Its subtle glow reads through the glass from across
// the room. The street runs along x at z 4–9; the sidewalk sits
// between it and the building front (z ≈ -5.7).
export const STREET_GHOSTS = [
  {
    x: [-25, 35],
    y: 0.28,
    z: 1.5,
    height: 1.75,
    speed: 1.1,
    wait: 9,
    seed: 0.27
  }
] as const satisfies readonly {
  x: [number, number]
  y: number
  z: number
  height: number
  speed: number
  wait: number
  seed: number
}[]

// Ground fog in the post pass (see applyFog in the postprocessing shader).
export const FOG_AMOUNT = 1.3
// Linear, pre-tonemap — so it reads brighter on screen than the hex suggests.
export const FOG_COLOR = "#7a64aa"

// Multiplies the baked office lightmaps to add a red cast.
export const LIGHTMAP_TINT: [r: number, g: number, b: number] = [
  1.25, 0.55, 0.5
]

export const STORM = {
  // How strongly a sky strike lights the office.
  lightningIndoor: 2,
  // Odds a strike cuts the power, and how long it stays out:
  // [minimum seconds, random extra seconds].
  powerCutChance: 0.35,
  outFor: [1.2, 2] as [number, number],
  // Light level while the power is out (0 would be pitch black).
  blackout: 0.12
}

// Spider webs strung across corners: the frame threads run anchor to anchor
// in order (a closed loop), radials run from the hub out to the frame, and the
// capture spiral winds `turns` times between them. Anchors are world-space
// points glued to walls/ceilings, ~1 cm off the surface. Corner webs read
// best with anchors on both walls so the web cuts across the corner.
export interface SpiderWeb {
  name: string
  anchors: [number, number, number][]
  // Defaults to the anchors' middle.
  hub?: [number, number, number]
  spokes: number
  turns: number
  // Seeds the jitter, broken spiral threads and loose strands.
  seed: number
  // Fraction of spiral threads missing.
  torn?: number
  // Loose threads hanging off the frame.
  strands?: number
  // Relative silk opacity; close-up webs need less contrast.
  opacity?: number
  // Relative motion; webs on narrow trim must stay close to their anchors.
  motion?: number
}

export const SPIDER_WEBS: SpiderWeb[] = [
  {
    // On the tilted bezel, outside the screen's octagonal cutout.
    name: "lab-bezel-top-left",
    anchors: [
      [2.535, 1.69, -14.1844],
      [2.625, 1.69, -14.1844],
      [2.535, 1.59, -14.1437]
    ],
    spokes: 8,
    turns: 4,
    seed: 0.27,
    torn: 0.3,
    opacity: 0.35,
    motion: 0.15
  },
  {
    name: "lab-bezel-top-right",
    anchors: [
      [3.393, 1.69, -14.1844],
      [3.303, 1.69, -14.1844],
      [3.393, 1.59, -14.1437]
    ],
    spokes: 7,
    turns: 4,
    seed: 0.76,
    torn: 0.35,
    opacity: 0.3,
    motion: 0.15
  },
  {
    name: "home-tv-corner",
    anchors: [
      [9.45, 3.3, -14.57],
      [10.05, 3.3, -14.57],
      [10.05, 2.73, -14.57]
    ],
    spokes: 11,
    turns: 6,
    seed: 0.82,
    torn: 0.16,
    strands: 1
  },
  {
    name: "home-lower-cubby",
    anchors: [
      [2.06, 4.08, -11.35],
      [2.06, 4.08, -11.85],
      [2.06, 3.51, -11.85]
    ],
    spokes: 10,
    turns: 6,
    seed: 0.48,
    torn: 0.2
  },
  {
    name: "services-window-bottom",
    anchors: [
      [3.05, 1.05, -5.92],
      [3.52, 1.05, -5.92],
      [3.05, 1.5, -5.92]
    ],
    spokes: 10,
    turns: 5,
    seed: 0.93,
    torn: 0.18
  },
  {
    name: "people-wall-corner",
    anchors: [
      [12.45, 6.3, -22.41],
      [13.08, 6.3, -22.41],
      [13.08, 5.73, -22.41]
    ],
    spokes: 12,
    turns: 7,
    seed: 0.64,
    strands: 1
  },
  {
    name: "blog-poster-corner",
    anchors: [
      [8.34, 6.2, -17.15],
      [8.34, 6.2, -17.75],
      [8.34, 5.65, -17.15]
    ],
    spokes: 11,
    turns: 6,
    seed: 0.54,
    torn: 0.15,
    strands: 1
  },
  {
    // Top right corner of the corridor opening, left of the TVs.
    name: "home-corridor",
    anchors: [
      [6.45, 3.32, -14.7],
      [7.08, 3.32, -14.95],
      [7.08, 2.55, -14.7]
    ],
    spokes: 13,
    turns: 8,
    seed: 0.21,
    strands: 2
  },
  {
    // Top left corner of the glass door.
    name: "home-glass-door",
    anchors: [
      [3.61, 3.13, -14.57],
      [4.15, 3.13, -14.57],
      [3.61, 2.6, -14.57]
    ],
    spokes: 11,
    turns: 6,
    seed: 0.12,
    torn: 0.08,
    strands: 1
  },
  {
    // Relocated from the Daylight bay to the now-empty Starship shelf.
    name: "showcase-starship-shelf",
    anchors: [
      [1.925, 4.4, -13.49],
      [1.925, 4.4, -14.18],
      [1.925, 3.84, -14.18],
      [1.925, 3.84, -13.49]
    ],
    // Behind the candles, with room for sway in front of the wood back.
    hub: [1.925, 4.21, -13.73],
    spokes: 14,
    turns: 8,
    seed: 0.89,
    torn: 0.2,
    strands: 2
  },
  {
    // Between the brick pillar and the shelves, above the clock.
    name: "services-corner",
    anchors: [
      [2.12, 3.98, -6.01],
      [2.8, 3.75, -6.01],
      [2.12, 3.28, -6.01],
      [2.12, 3.7, -6.7]
    ],
    spokes: 15,
    turns: 8,
    seed: 0.73,
    strands: 1
  },
  {
    // Top corners of the window panes, in front of the glass.
    name: "services-window-left",
    anchors: [
      [5.21, 3.21, -5.92],
      [4.72, 3.21, -5.92],
      [5.21, 2.68, -5.92]
    ],
    spokes: 11,
    turns: 7,
    seed: 0.44,
    strands: 1
  },
  {
    name: "services-window-right",
    anchors: [
      [3.05, 3.21, -5.92],
      [3.5, 3.21, -5.92],
      [3.05, 2.75, -5.92]
    ],
    spokes: 10,
    turns: 6,
    seed: 0.67,
    torn: 0.12
  },
  {
    // Where the poster wall meets the sloped roof.
    name: "people-roof",
    anchors: [
      [13.11, 6.65, -26.9],
      [13.11, 7.29, -27.4],
      [12.2, 7.66, -27.0]
    ],
    spokes: 14,
    turns: 8,
    seed: 0.58,
    torn: 0.12,
    strands: 2
  },
  {
    // Top corner of the Blog door frame.
    name: "blog-door",
    anchors: [
      [8.3, 6.05, -19.6],
      [8.3, 5.4, -20.21],
      [8.3, 6.05, -20.21]
    ],
    spokes: 11,
    turns: 6,
    seed: 0.36,
    torn: 0.1,
    strands: 1
  },
  {
    // Top left corner of the kitchen nook.
    name: "blog-kitchen",
    anchors: [
      [8.5, 6.18, -20.92],
      [8.5, 6.18, -21.5],
      [8.5, 5.6, -20.92]
    ],
    spokes: 11,
    turns: 7,
    seed: 0.15,
    strands: 1
  },
  {
    // The dusty gap between the wall and the sofa's arm.
    name: "blog-sofa",
    anchors: [
      [8.34, 4.5, -16.55],
      [9.3, 4.42, -16.68],
      [8.95, 3.74, -16.62],
      [8.34, 3.8, -16.5]
    ],
    spokes: 15,
    turns: 8,
    seed: 0.31,
    torn: 0.15,
    strands: 2
  }
]

// How close (world units) the cursor has to pass a web's hub to pluck it.
export const WEB_PLUCK_RADIUS = 0.4

// Bases sit on the exported office's horizontal surfaces (Y-up).
// Rotation spreads the shelf groups along Z, inside the shallow cubbies.
export const CANDLE_CLUSTERS = [
  {
    name: "services-floor-left",
    position: [2.65, 0.653, -7.35],
    scale: 1.05,
    rotation: 0.3
  },
  {
    name: "services-floor-window",
    position: [5.5, 0.653, -7.25],
    scale: 0.9,
    rotation: 0.2
  },
  {
    name: "services-shelf",
    position: [1.99, 3.48, -7.3],
    scale: 0.7,
    rotation: Math.PI / 2
  },
  {
    name: "stairs-low",
    // Keep the bases inside the left tread edge, clear of the walking area.
    position: [2.42, 1.031, -11],
    scale: 0.85,
    rotation: 0
  },
  {
    name: "floor-stairs",
    position: [3.85, 0, -12.1],
    scale: 1.2,
    rotation: 0.4
  },
  { name: "floor-tv", position: [9.3, 0, -13.25], scale: 1.1, rotation: 1.1 },
  {
    name: "shelf-low",
    position: [1.99, 1.957, -11.6],
    scale: 0.7,
    rotation: Math.PI / 2
  },
  {
    name: "showcase-starship-shelf",
    position: [1.99, 3.825, -13.84],
    scale: 0.75,
    rotation: Math.PI / 2
  },
  {
    name: "desk-left",
    position: [4.6, 4.495, -24.4],
    scale: 0.8,
    rotation: 0.3
  },
  {
    name: "desk-middle",
    position: [7.2, 4.495, -25.5],
    scale: 0.8,
    rotation: 0.6
  },
  {
    name: "desk-right",
    position: [10.8, 4.493, -26.5],
    scale: 0.85,
    rotation: 1.2
  },
  {
    name: "floor-upstairs",
    position: [9.5, 3.726, -24.4],
    scale: 1.05,
    rotation: 0.8
  }
] as const

export interface HalloweenPumpkin {
  asset: "C01" | "C02" | "C03"
  position: [number, number, number]
  // Total authored model height, including the stem, in world metres.
  height: number
  rotation: number
  faceCamera?: "home"
}

// C03 is always largest, C02 medium, C01 smallest. The Home floor groups
// leave the corridor clear and overlap in projection without hiding faces.
export const PUMPKINS: readonly HalloweenPumpkin[] = [
  {
    asset: "C03",
    position: [4.95, 0, -11.15],
    height: 0.6,
    rotation: 0.6,
    faceCamera: "home"
  },
  { asset: "C01", position: [4.86, 0, -10.72], height: 0.24, rotation: -0.35 },
  {
    asset: "C03",
    position: [7.88, 0, -12.32],
    height: 0.55,
    rotation: -0.65,
    faceCamera: "home"
  },
  {
    asset: "C02",
    position: [7.48, 0, -12.08],
    height: 0.36,
    rotation: -0.85,
    faceCamera: "home"
  },
  { asset: "C01", position: [7.89, 0, -11.88], height: 0.23, rotation: 0.3 },
  { asset: "C02", position: [2.7, 0.653, -6.95], height: 0.38, rotation: 2.5 },
  { asset: "C01", position: [1.99, 3.824, -9.5], height: 0.22, rotation: 1.2 },
  {
    asset: "C03",
    position: [9.65, 3.726, -24.05],
    height: 0.57,
    rotation: -0.5
  },
  { asset: "C01", position: [4.15, 4.495, -24.35], height: 0.24, rotation: 1.1 }
]
