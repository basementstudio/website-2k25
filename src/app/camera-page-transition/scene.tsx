"use client";

import { customKTX2Loader } from "@/utils/loaders";
import { Environment, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { CameraControls } from "./camera-controls";
import { Mesh, MeshStandardMaterial, Vector3 } from "three";
import { useCameraStore, type CameraStore } from "@/store/camera-store";
import { GLTF } from "three/examples/jsm/Addons.js";

export const Scene = () => (
  <Canvas camera={useCameraStore((state: CameraStore) => state.cameraConfig)}>
    <CameraControls
      {...useCameraStore((state: CameraStore) => state.cameraConfig)}
    />
    <Webby />
    <NikeBook />
    <gridHelper />
    <Environment preset="sunset" />
  </Canvas>
);

const Webby = () => {
  const { nodes } = customKTX2Loader("/models/misc/webby_ktx2_optimized.glb");
  const {
    setCameraConfig,
    previousConfig,
    cameraConfig: currentConfig,
  } = useCameraStore();

  const webbyConfig = {
    position: new Vector3(2, 0.5, 0),
    target: new Vector3(2, 0.1, -2),
  };

  const handleClick = () => {
    if (currentConfig.position?.equals(webbyConfig.position)) {
      setCameraConfig(previousConfig);
    } else {
      setCameraConfig(webbyConfig);
    }
  };

  return (
    <group position={[2, 0, -2]} onClick={handleClick}>
      {Object.values(nodes)
        .filter((node) => node.type === "Mesh")
        .map((node) => (
          <primitive object={node} key={node.name} />
        ))}
    </group>
  );
};

type GLTFResult = GLTF & {
  nodes: {
    Cube225: Mesh;
  };
  materials: {
    ["Nike-book"]: MeshStandardMaterial;
  };
};

const NikeBook = () => {
  const { nodes, materials } = useGLTF(
    "/models/misc/nike.glb",
  ) as unknown as GLTFResult;
  const {
    setCameraConfig,
    previousConfig,
    cameraConfig: currentConfig,
  } = useCameraStore();

  const nikeConfig = {
    position: new Vector3(-1.2, 0.3, -1),
    target: new Vector3(-1.9, 0.2, -2),
  };

  const handleClick = () => {
    if (currentConfig.position?.equals(nikeConfig.position)) {
      setCameraConfig(previousConfig);
    } else {
      setCameraConfig(nikeConfig);
    }
  };

  return (
    <group dispose={null} position={[-2, 0, -2]} onClick={handleClick}>
      <mesh
        castShadow
        receiveShadow
        rotation={[0, -Math.PI / 2 + 0.5, 0]}
        geometry={nodes.Cube225.geometry}
        material={materials["Nike-book"]}
        position={[0.011, 0.23, -0.043]}
        scale={[0.033, 0.208, 0.208]}
      />
    </group>
  );
};

useGLTF.preload("/models/misc/nike.glb");
