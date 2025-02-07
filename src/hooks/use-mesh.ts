
import { Mesh } from "three";
import { create } from "zustand";

export interface MeshStore {
  hoopMesh: Mesh | null
}


/** Global store for extracted meshes */
export const useMesh = create<MeshStore>()((set) => ({
  hoopMesh: null,
}))
