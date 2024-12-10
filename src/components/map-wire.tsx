"use client";

import { useGLTF } from "@react-three/drei";
import { GLTFResult } from "./map";
import { Mesh, MeshStandardMaterial, ShaderMaterial } from "three";
import { createShaderMaterial } from "@/shaders/custom-shader-material";
import { memo, useEffect, useMemo, useState } from "react";

export const MapWire = memo(MapWireInner);

function MapWireInner() {
  const { nodes } = useGLTF("/models/map-wire.glb") as unknown as GLTFResult;
  const [material, setMaterial] = useState<ShaderMaterial | null>(null);

  useEffect(() => {
    setMaterial(
      createShaderMaterial(
        (nodes.WireFrame_MeshCurveMesh as Mesh)
          .material as MeshStandardMaterial,
        true,
      ),
    );
  }, [nodes.WireFrame_MeshCurveMesh]);

  if (!material) return null;

  return (
    <group dispose={null} name="map-wire">
      <lineSegments
        geometry={(nodes.WireFrame_MeshCurveMesh as Mesh).geometry}
        material={material}
      />
    </group>
  );
}

useGLTF.preload("/models/map-wire.glb");
