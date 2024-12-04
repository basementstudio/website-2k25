import { useGLTF } from "@react-three/drei";
import { GLTFResult } from "./map";
import { Mesh, MeshStandardMaterial } from "three";
import { createShaderMaterial } from "@/shaders/custom-shader-material";

export const MapWire = () => {
  const { nodes } = useGLTF("/models/map-wire.glb") as unknown as GLTFResult;
  const material = createShaderMaterial(
    (nodes.WireFrame_MeshCurveMesh as Mesh).material as MeshStandardMaterial,
    true,
  );

  return (
    <group dispose={null}>
      <lineSegments
        geometry={(nodes.WireFrame_MeshCurveMesh as Mesh).geometry}
        material={material}
      />
    </group>
  );
};

useGLTF.preload("/models/map-wire.glb");
