import { Mesh } from "three"
import { create } from "zustand"

interface CarMeshes {
  backWheel: Mesh | null
  car: Mesh | null
  frontWheel: Mesh | null
}

export interface MeshStore {
  weather: {
    rain: Mesh | null
    loboMarino: Mesh | null
  }
  hoopMeshes: {
    hoop: Mesh | null
    hoopGlass: Mesh | null
  }
  carMeshes: CarMeshes
  outdoorCarsMeshes: (Mesh | null)[]
  arcade: {
    buttons: Mesh[] | null
    sticks: Mesh[] | null
  }
  blog: {
    lockedDoor: Mesh | null
    door: Mesh | null
    lamp: Mesh | null
    lampTargets: Mesh[] | null
  }
  cctv: {
    screen: Mesh | null
  }
  inspectableMeshes: Mesh[]
}

/** Global store for extracted meshes */
export const useMesh = create<MeshStore>()((set) => ({
  weather: {
    rain: null,
    loboMarino: null
  },
  hoopMeshes: {
    hoop: null,
    hoopGlass: null
  },
  hoopMesh: null,
  outdoorCars: null,
  carMeshes: {
    backWheel: null,
    car: null,
    frontWheel: null
  },
  arcade: {
    buttons: null,
    sticks: null
  },
  blog: {
    lockedDoor: null,
    door: null,
    lamp: null,
    lampTargets: null
  },
  cctv: {
    screen: null
  },
  outdoorCarsMeshes: [],
  inspectableMeshes: []
}))
