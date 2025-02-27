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
  inspectableMeshes: Mesh[]
}

/** Global store for extracted meshes */
export const useMesh = create<MeshStore>()((set) => ({
  hoopMesh: null,
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
  inspectableMeshes: []
}))
