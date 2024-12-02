import { shaderMaterial, useGLTF } from "@react-three/drei";
import { GLTF } from "three/examples/jsm/Addons.js";
import { Mesh, MeshStandardMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import { vertexShader } from "./vertex";
import { fragmentShader } from "./fragment";
import { useRef } from "react";
import { LineObject } from "../custom-material-line/page";

type GLTFResult = GLTF & {
  nodes: {
    [key: string]: Mesh;
  };
  materials: {
    [key: string]: MeshStandardMaterial;
  };
};

export const InstanceMap = () => {
  const { nodes } = useGLTF("/models/misc/map.glb") as unknown as GLTFResult;
  const arcadeMaterial = nodes.Accade001.material as MeshStandardMaterial;

  const CustomShaderMaterial = shaderMaterial(
    {
      uProgress: 0.0,
      baseColorMap: arcadeMaterial.map || null,
      baseColor: arcadeMaterial.color,
      opacity:
        arcadeMaterial.opacity !== undefined ? arcadeMaterial.opacity : 1.0,
    },
    vertexShader,
    fragmentShader,
  );

  const sharedMaterial = new CustomShaderMaterial();
  sharedMaterial.transparent = true;
  const progressRef = useRef(0.0);

  useFrame((_state, delta) => {
    progressRef.current = (progressRef.current + delta * 0.1) % 1.0;
    sharedMaterial.uniforms.uProgress.value = progressRef.current;
  });

  return (
    <group dispose={null} position={[-5, 0, 0]}>
      <LineObject />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Accade001.geometry}
        position={[2.937, 0.803, -14.205]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={0.954}
        material={sharedMaterial}
      />

      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube002.geometry}
        material={sharedMaterial}
        position={[2.174, 0.946, -16.388]}
        scale={0.28}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SM_Wood.geometry}
        material={sharedMaterial}
        position={[2.011, 5.608, -28.914]}
        scale={0.246}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante042.geometry}
        material={sharedMaterial}
        position={[2.021, 3.781, -19.768]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.246, 0.038, 0.246]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante043.geometry}
        material={sharedMaterial}
        position={[2.011, 6.833, -15.012]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.246}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante044.geometry}
        material={sharedMaterial}
        position={[2.017, 3.524, -6.113]}
        scale={0.246}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante045.geometry}
        material={sharedMaterial}
        position={[2.011, 4.158, -10.527]}
        scale={0.246}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante046.geometry}
        material={sharedMaterial}
        position={[2.011, 5.592, -14.813]}
        scale={0.246}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante047.geometry}
        material={sharedMaterial}
        position={[2.011, 5.608, -17.54]}
        scale={0.246}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante051.geometry}
        material={sharedMaterial}
        position={[1.993, 3.116, -7.996]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.246, 0.008, 0.246]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante061.geometry}
        material={sharedMaterial}
        position={[2.017, 3.725, -9.941]}
        scale={0.246}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante062.geometry}
        material={sharedMaterial}
        position={[2.017, 3.396, -14.218]}
        scale={0.246}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante063.geometry}
        material={sharedMaterial}
        position={[2.017, 5.266, -16.952]}
        scale={0.246}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante064.geometry}
        material={sharedMaterial}
        position={[2.017, 5.266, -21.226]}
        scale={0.246}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante065.geometry}
        material={sharedMaterial}
        position={[2.017, 5.266, -28.618]}
        scale={0.246}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante079.geometry}
        material={sharedMaterial}
        position={[2.011, 5.608, -21.822]}
        scale={0.246}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante019.geometry}
        material={sharedMaterial}
        position={[2.041, 0.708, -8.389]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.246, 0.008, 0.246]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante020.geometry}
        material={sharedMaterial}
        position={[2.054, 0.048, -12.666]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.246, 0.008, 0.246]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante021.geometry}
        material={sharedMaterial}
        position={[3.439, 2.719, -12.31]}
        scale={1.105}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante022.geometry}
        material={sharedMaterial}
        position={[1.685, 0.693, -9.513]}
        rotation={[Math.PI / 2, 0, -Math.PI / 2]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante023.geometry}
        material={sharedMaterial}
        position={[2.797, 1.862, -12.181]}
        scale={[0.88, 1.069, 1.076]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante024.geometry}
        material={sharedMaterial}
        position={[2.161, 2.185, -12.684]}
        rotation={[0.624, 0, 0]}
        scale={[2.21, 1.076, 1.09]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante025.geometry}
        material={sharedMaterial}
        position={[3.434, 2.185, -12.684]}
        rotation={[0.624, 0, 0]}
        scale={[2.21, 1.076, 1.09]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Muro_Ext004.geometry}
        material={sharedMaterial}
        position={[2.384, 3.708, -5.837]}
        scale={1.105}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Muro_Ext005.geometry}
        material={sharedMaterial}
        position={[7.154, 1.67, -5.837]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante026.geometry}
        material={sharedMaterial}
        position={[4.119, 0.527, -5.879]}
        scale={1.105}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Muro_Exterior001.geometry}
        material={sharedMaterial}
        position={[1.864, 24.367, -45.249]}
        rotation={[0, 0, -Math.PI / 2]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane007.geometry}
        material={sharedMaterial}
        position={[7.657, 5.271, -29.311]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane009.geometry}
        material={sharedMaterial}
        position={[8.407, 3.469, -5.872]}
        rotation={[0, 0, -Math.PI / 2]}
        scale={0.1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.PB_Muro005.geometry}
        material={sharedMaterial}
        position={[8.591, 1.666, -19.208]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.PB_Muro006.geometry}
        material={sharedMaterial}
        position={[4.704, 1.665, -20.787]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.PB_Muro007.geometry}
        material={sharedMaterial}
        position={[7.205, 1.666, -7.543]}
        scale={1.105}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SM_BASEMENT.geometry}
        material={sharedMaterial}
        position={[8.591, 2.363, -19.082]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.PA_Muro003.geometry}
        material={sharedMaterial}
        position={[7.247, 7.088, -19.67]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.PA_Interior_Wall.geometry}
        material={sharedMaterial}
        position={[7.624, 4.918, -17.905]}
        rotation={[0, 0, -Math.PI]}
        scale={[-1, -1, -1.01]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.PA_Interior_Wall001.geometry}
        material={sharedMaterial}
        position={[7.624, 4.918, -20.579]}
        scale={[1, 1, 1.01]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SM_Riel.geometry}
        material={sharedMaterial}
        position={[2.661, 6.624, -29.071]}
        scale={0.1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.PA_Baranda002.geometry}
        material={sharedMaterial}
        position={[8.072, 4.866, -13.95]}
        scale={0.055}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SM_PB_Floor.geometry}
        material={sharedMaterial}
        position={[7.537, 0, -24.093]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante030.geometry}
        material={sharedMaterial}
        position={[2.441, -2.748, -16.377]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante031.geometry}
        material={sharedMaterial}
        position={[2.573, 0.473, -16.383]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      />

      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_Low.geometry}
        material={sharedMaterial}
        position={[8.076, 0.036, -5.776]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SM_FloorPA.geometry}
        material={sharedMaterial}
        position={[6.33, 3.882, -28.613]}
        scale={0.177}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes["G-__559308"].geometry}
        material={sharedMaterial}
        position={[5.483, 0, -14.609]}
        scale={[1.332, 1.666, 1.105]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes["G-__555870"].geometry}
        material={sharedMaterial}
        position={[4.51, 0.969, -5.827]}
        scale={[1.105, 0.856, 6.925]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane011.geometry}
        material={sharedMaterial}
        position={[4.012, 2.254, -5.906]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SM_PB_Glass.geometry}
        material={sharedMaterial}
        position={[4.195, 2.254, -14.641]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <group
        position={[5.2, 3.404, -14.409]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={1.24}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.mount_01.geometry}
          material={sharedMaterial}
          position={[-0.001, 0.015, 0.329]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Bolt001.geometry}
            material={sharedMaterial}
            position={[0.023, 0.02, 0.001]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.mount_02.geometry}
          material={sharedMaterial}
          position={[-0.002, 0.26, 0.218]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Weld_4.geometry}
            material={sharedMaterial}
            position={[15.429, 6.302, 9.966]}
            scale={0.2}
          />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.net.geometry}
          material={sharedMaterial}
          position={[-0.003, 0.261, 0.218]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.ring.geometry}
          material={sharedMaterial}
          position={[-0.002, 0.26, 0.218]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.shield.geometry}
          material={sharedMaterial}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </group>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.PA_Carpinteria028.geometry}
        material={sharedMaterial}
        position={[5.964, 6.634, -16.813]}
        scale={1.105}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.PA_Carpinteria029.geometry}
        material={sharedMaterial}
        position={[5.964, 6.634, -18.403]}
        scale={1.105}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Glass003.geometry}
        material={sharedMaterial}
        position={[3.923, 5.302, -29.255]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SM_PA_FrameWindows.geometry}
        material={sharedMaterial}
        position={[8.057, 4.288, -29.351]}
        scale={[0.893, 0.893, 2.799]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube176.geometry}
        material={sharedMaterial}
        position={[8.069, 4.847, -21.561]}
        scale={[0.218, 0.032, 0.669]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube175.geometry}
        material={sharedMaterial}
        position={[8.069, 4.847, -21.561]}
        scale={[0.218, 0.032, 0.669]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube064.geometry}
        material={sharedMaterial}
        position={[7.996, 6.193, -21.564]}
        scale={[0.218, 0.032, 0.669]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SM_Banco.geometry}
        material={sharedMaterial}
        position={[7.739, 4.132, -17.223]}
        scale={0.418}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes["G-__556005"].geometry}
        material={sharedMaterial}
        position={[1.86, 3.703, -14.659]}
        scale={1.105}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.TV009_Metal_0.geometry}
        material={sharedMaterial}
        position={[9.156, 0, -14.19]}
        rotation={[-Math.PI / 2, 0, -0.458]}
      />
    </group>
  );
};

useGLTF.preload("/models/misc/map.glb");
