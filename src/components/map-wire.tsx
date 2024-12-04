import { useGLTF } from "@react-three/drei";
import { GLTFResult } from "./map";
import { Mesh, MeshStandardMaterial, ShaderMaterial } from "three";
import { createShaderMaterial } from "@/shaders/custom-shader-material";
import { useFrame } from "@react-three/fiber";
import { customPowTwo } from "@/utils/animations";

export const MapWire = () => {
  const { nodes } = useGLTF("/models/map-wire.glb") as unknown as GLTFResult;
  const material = createShaderMaterial(
    (nodes.WireFrame_MeshCurveMesh as Mesh).material as MeshStandardMaterial,
    true,
  );

  useFrame(({ clock }) => {
    if (material instanceof ShaderMaterial) {
      const progress = (clock.getElapsedTime() % 3) / 3;
      material.uniforms.uProgress.value = customPowTwo(progress);
    }
  });

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
