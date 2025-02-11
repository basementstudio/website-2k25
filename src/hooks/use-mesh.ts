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
}

/** Global store for extracted meshes */
export const useMesh = create<MeshStore>()((set) => ({
  hoopMesh: null,
  carMeshes: {
    backWheel: null,
    car: null,
    frontWheel: null
  },
  inspectableMeshes: []
}))
