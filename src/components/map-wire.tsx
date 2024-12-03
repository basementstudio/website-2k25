import { useGLTF } from "@react-three/drei";
import React from "react";
import { GLTFResult } from "./map";
import { Mesh, MeshStandardMaterial } from "three";
import { createShaderMaterial } from "@/shaders/custom-shader-material";

export const MapWire = () => {
  const { nodes } = useGLTF("/models/map-wire.glb") as unknown as GLTFResult;
  return (
    <group dispose={null}>
      <lineSegments
        geometry={(nodes.WireFrame_MeshCurveMesh as Mesh).geometry}
        material={createShaderMaterial(
          (nodes.WireFrame_MeshCurveMesh as Mesh)
            .material as MeshStandardMaterial,
        )}
      />
    </group>
  );
};

useGLTF.preload("/models/map-wire.glb");
