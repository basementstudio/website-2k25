import { Mesh } from "three"
import { create } from "zustand"

interface blog {
  /**
   * The door and the picaporte (lock handle, formerly the separate
   * SM_00_012 mesh) used to be two rotating objects. They're now two shape
   * keys on this one merged mesh (SM_00_010) — same mechanic as
   * SM_Controls: drive morphTargetInfluences by index instead of rotation.
   */
  door: Mesh | null
  /** index into door.morphTargetInfluences for the door-swing shape key ("SM_00_010") */
  doorMorphIndex: number | null
  /** index into door.morphTargetInfluences for the picaporte shape key ("SM_00_012") */
  lockedDoorMorphIndex: number | null
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
  /** SM_KitCat — the outer node, used for placement (<primitive object={clock}/>). */
  clock: Mesh | null
  /**
   * "Kit-Cat" — the nested child mesh that actually holds the "Time" shape
   * key driving the eyes+tail swing together. Separate from `clock` because
   * the hand/eye/tail geometry lives one level deeper in the hierarchy.
   */
  clockBody: Mesh | null
  /** index into clockBody.morphTargetInfluences for the "Time" shape key */
  clockMorphIndex: number | null
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
    door: null,
    doorMorphIndex: null,
    lockedDoorMorphIndex: null,
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
    clockBody: null,
    clockMorphIndex: null,
    pot: null
  },
  cars: [],
  cctv: {
    screen: null
  }
}))
