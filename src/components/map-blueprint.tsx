import { useGLTF } from "@react-three/drei";
import { Material, Mesh } from "three";
import { GLTF } from "three/examples/jsm/Addons.js";

type GLTFResult = GLTF & {
  nodes: {
    [key: string]: Mesh;
  };
  materials: {
    [key: string]: Material;
  };
};

export const MapBlueprint = () => {
  const { nodes, materials } = useGLTF(
    "/models/misc/map-blueprint.glb",
  ) as unknown as GLTFResult;
  return (
    <group dispose={null} position={[-5, 0, 0]} scale={0.9999}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WireFrame_Bake.geometry}
        material={materials.lINE}
        position={[7.154, 1.673, -5.84]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial color="#91A2BE" />
      </mesh>
    </group>
  );
};

useGLTF.preload("/models/misc/map-blueprint.glb");
