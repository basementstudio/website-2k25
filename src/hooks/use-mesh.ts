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

interface arcade {
  buttons: Mesh[] | null
  sticks: Mesh[] | null
}

interface basketball {
  hoop: Mesh | null
  hoopGlass: Mesh | null
  net: Mesh | null
}

export interface MeshStore {
  godrays: Mesh[]
  inspectables: Mesh[]
  blog: blog
  arcade: arcade
  basketball: basketball
  weather: weather
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
  cars: [],
  cctv: {
    screen: null
  }
}))
