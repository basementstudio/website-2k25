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
    center: [6.2, 0, -10.9],
    normal: [0, 1, 0],
    tangent: [1, 0, 0],
    size: [5, 4.6],
    count: 7
  },
  {
    // Above the TVs, around the neon logo.
    name: "home-back-wall",
    center: [8.1, 2.7, -14.58],
    normal: [0, 0, 1],
    tangent: [1, 0, 0],
    size: [3.6, 1.6],
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
    center: [8.45, 5.4, -22.4],
    normal: [0, 0, -1],
    tangent: [-1, 0, 0],
    size: [3, 2],
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
    center: [8.35, 5.9, -19.2],
    normal: [1, 0, 0],
    tangent: [0, 0, -1],
    size: [3.4, 1.8],
    count: 4
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
export const SPIDER_SCALE: [min: number, max: number] = [0.09, 0.15]
// World units per second while walking, before the per-spider size factor.
export const SPIDER_SPEED: [min: number, max: number] = [0.35, 0.8]
export const SPIDER_FLEE_SPEED = 1.6
// How close (world units) the cursor's hit point on a patch has to get
// before a spider on it bolts.
export const SPIDER_FLEE_RADIUS = 0.55

// Floating ghosts: each drifts along a Lissajous loop around `center`,
// `radius` being its [x, z] reach. `scale` is the ghost's height.
export const GHOSTS = [
  // Home: one low over the floor, one up by the shelves and stairs.
  {
    center: [6.2, 1.5, -11],
    radius: [1.8, 1.4],
    scale: 0.6,
    speed: 0.22,
    seed: 0.13
  },
  {
    center: [4.2, 3.1, -10.5],
    radius: [1.2, 1.6],
    scale: 0.5,
    speed: 0.17,
    seed: 0.58
  },
  // Upstairs, roaming between People and the Blog corner.
  {
    center: [10.4, 4.95, -22],
    radius: [1.3, 3.6],
    scale: 0.55,
    speed: 0.12,
    seed: 0.91
  }
] as const satisfies readonly {
  center: [number, number, number]
  radius: [number, number]
  scale: number
  speed: number
  seed: number
}[]

// Ghosts drifting down the street out front (seen through the Services
// windows): each crosses x from → to at `speed` units/s, then waits `wait`
// seconds off-screen. Oversized and extra bright so they read through the
// glass from across the room. The street runs along x at z 4–9; the sidewalk sits
// between it and the building front (z ≈ -5.7).
export const STREET_GHOSTS = [
  { x: [-25, 35], y: 1.2, z: 1.5, scale: 2.2, speed: 2.2, wait: 6, seed: 0.27 },
  { x: [35, -25], y: 1.6, z: 6.5, scale: 2.8, speed: 1.6, wait: 9, seed: 0.64 },
  { x: [-25, 35], y: 2.2, z: 11, scale: 2.6, speed: 1.9, wait: 12, seed: 0.83 }
] as const satisfies readonly {
  x: [number, number]
  y: number
  z: number
  scale: number
  speed: number
  wait: number
  seed: number
}[]

// Ground fog in the post pass (see applyFog in the postprocessing shader).
export const FOG_AMOUNT = 1.3
// Linear, pre-tonemap — so it reads brighter on screen than the hex suggests.
export const FOG_COLOR = "#7a64aa"

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
