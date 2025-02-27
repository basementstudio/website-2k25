import { Mesh } from "three"
import { create } from "zustand"

interface CarMeshes {
  backWheel: Mesh | null
  car: Mesh | null
  frontWheel: Mesh | null
}

export interface MeshStore {
  hoopMesh: Mesh | null
  carMeshes: CarMeshes
  inspectableMeshes: Mesh[]
  arcade: {
    buttons: Mesh[] | null
    sticks: Mesh[] | null
  }
  blog: {
    lockedDoor: Mesh | null
    door: Mesh | null
  }
  cctv: {
    screen: Mesh | null
  }
}

/** Global store for extracted meshes */
export const useMesh = create<MeshStore>()((set) => ({
  hoopMesh: null,
  carMeshes: {
    backWheel: null,
    car: null,
    frontWheel: null
  },
  inspectableMeshes: [],
  arcade: {
    buttons: null,
    sticks: null
  },
  blog: {
    lockedDoor: null,
    door: null
  },
  cctv: {
    screen: null
  }
}))
