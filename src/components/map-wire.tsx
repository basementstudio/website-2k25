import { useGLTF } from "@react-three/drei";
import React from "react";
import { GLTFResult } from "./map";
import { Mesh } from "three";

export const MapWire = () => {
  const { nodes } = useGLTF("/models/map-wire.glb") as unknown as GLTFResult;
  return (
    <group dispose={null}>
      <lineSegments
        geometry={(nodes.WireFrame_MeshCurveMesh as Mesh).geometry}
        material={(nodes.WireFrame_MeshCurveMesh as Mesh).material}
      />
    </group>
  );
};

useGLTF.preload("/models/map-wire.glb");
