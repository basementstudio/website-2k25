import { Mesh } from "three"
import { create } from "zustand"

interface blog {
  lockedDoor: Mesh | null
  door: Mesh | null
  lamp: Mesh | null
  lampTargets: Mesh[] | null
}

interface weather {
  rain: Mesh | null
  loboMarino: Mesh | null
}

/** A single arcade button, driven by one morph target on the merged mesh. */
export interface ArcadeButton {
  name: string
  /** index into controls.morphTargetInfluences (0 = rest, 1 = pressed -0.0075) */
  morphIndex: number
  /** world-space centroid, used to place the invisible interaction proxy */
  center: [number, number, number]
}

/** A joystick, driven by two morph targets (RotX / RotY, -1..1 = -15..15deg). */
export interface ArcadeStick {
  name: string
  morphX: number
  morphY: number
  center: [number, number, number]
}

interface arcade {
  /** the single merged mesh (SM_Controls) that holds all morph targets */
  controls: Mesh | null
  buttons: ArcadeButton[] | null
  sticks: ArcadeStick[] | null
}

interface basketball {
  hoop: Mesh | null
  hoopGlass: Mesh | null
  net: Mesh | null
}

interface services {
  clock: Mesh | null
  pot: Mesh | null
}

export interface MeshStore {
  godrays: Mesh[]
  inspectables: Mesh[]
  blog: blog
  arcade: arcade
  basketball: basketball
  weather: weather
  services: services
  cars: (Mesh | null)[]
  cctv: { screen: Mesh | null }
}

export const useMesh = create<MeshStore>()(() => ({
  godrays: [],
  inspectables: [],
  blog: {
    lockedDoor: null,
    door: null,
    lamp: null,
    lampTargets: null
  },
  arcade: {
    controls: null,
    buttons: null,
    sticks: null
  },
  basketball: {
    hoop: null,
    hoopGlass: null,
    net: null
  },
  weather: {
    rain: null,
    loboMarino: null
  },
  services: {
    clock: null,
    pot: null
  },
  cars: [],
  cctv: {
    screen: null
  }
}))
