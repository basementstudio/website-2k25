import { useGLTF } from "@react-three/drei"
import {
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshToonMaterial
} from "three"

import { createInstancedSkinnedMesh } from "./instanced-skinned-mesh"

const {
  InstancePosition: DebugPosition,
  useInstancedMesh: useDebugMesh,
  InstancedMesh: DebugInstancedMesh
} = createInstancedSkinnedMesh()

const material = new MeshLambertMaterial({
  color: "green",
  side: DoubleSide
  // wireframe: true
})

export function DebugMorph() {
  const { nodes } = useGLTF("/cosos.glb") as any

  return (
    <>
      <DebugInstancedMesh
        material={material}
        mesh={[nodes.Sphere, nodes.Cube]}
        count={10}
      />
      <DebugPosition
        position={[0, 0, -13.5]}
        geometryId={0}
        activeMorphName="Key 1"
      />
      <DebugPosition
        position={[3, 0, -13.5]}
        geometryId={1}
        activeMorphName="Key 1"
      />
      {/* <DebugPosition
        position={[3, 0, -13.5]}
        geometryId={0}
        activeMorphName="Key 2"
      />

      <DebugPosition
        position={[5, 0, -13.5]}
        geometryId={1}
        activeMorphName="Key 1"
      />

      <DebugPosition
        position={[7, 0, -13.5]}
        geometryId={1}
        activeMorphName="Key 3"
      /> */}
      <ambientLight intensity={0.5} />

      <pointLight position={[5, 5, -10.5]} intensity={50} />
    </>
  )
}
