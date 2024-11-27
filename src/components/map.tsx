import { useCameraStore } from "@/store/app-store";
import { useGLTF } from "@react-three/drei";
import { Mesh } from "three";
import { GLTF } from "three/examples/jsm/Addons.js";

type GLTFResult = GLTF & {
  nodes: {
    [key: string]: Mesh;
  };
};

export const Map = () => {
  const { nodes } = useGLTF("/models/misc/map.glb") as unknown as GLTFResult;
  const { setCameraState } = useCameraStore();
  return (
    <group dispose={null}>
      <mesh
        name="Cube002"
        castShadow
        receiveShadow
        geometry={nodes.Cube002.geometry}
        material={nodes.Cube002.material}
        position={[2.174, 0.946, -16.388]}
        scale={0.28}
      />
      <mesh
        name="SM_Wood"
        castShadow
        receiveShadow
        geometry={nodes.SM_Wood.geometry}
        material={nodes.SM_Wood.material}
        position={[2.011, 5.608, -28.914]}
        scale={0.246}
      />
      <mesh
        name="Escalera_Parante042"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante042.geometry}
        material={nodes.Escalera_Parante042.material}
        position={[2.021, 3.781, -19.768]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.246, 0.038, 0.246]}
      />
      <mesh
        name="Escalera_Parante043"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante043.geometry}
        material={nodes.Escalera_Parante043.material}
        position={[2.011, 6.833, -15.012]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.246}
      />
      <mesh
        name="Escalera_Parante044"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante044.geometry}
        material={nodes.Escalera_Parante044.material}
        position={[2.017, 3.524, -6.113]}
        scale={0.246}
      />
      <mesh
        name="Escalera_Parante045"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante045.geometry}
        material={nodes.Escalera_Parante045.material}
        position={[2.011, 4.158, -10.527]}
        scale={0.246}
      />
      <mesh
        name="Escalera_Parante046"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante046.geometry}
        material={nodes.Escalera_Parante046.material}
        position={[2.011, 5.592, -14.813]}
        scale={0.246}
      />
      <mesh
        name="Escalera_Parante047"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante047.geometry}
        material={nodes.Escalera_Parante047.material}
        position={[2.011, 5.608, -17.54]}
        scale={0.246}
      />
      <mesh
        name="Escalera_Parante051"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante051.geometry}
        material={nodes.Escalera_Parante051.material}
        position={[1.993, 3.116, -7.996]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.246, 0.008, 0.246]}
      />
      <mesh
        name="Escalera_Parante061"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante061.geometry}
        material={nodes.Escalera_Parante061.material}
        position={[2.017, 3.725, -9.941]}
        scale={0.246}
      />
      <mesh
        name="Escalera_Parante062"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante062.geometry}
        material={nodes.Escalera_Parante062.material}
        position={[2.017, 3.396, -14.218]}
        scale={0.246}
      />
      <mesh
        name="Escalera_Parante063"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante063.geometry}
        material={nodes.Escalera_Parante063.material}
        position={[2.017, 5.266, -16.952]}
        scale={0.246}
      />
      <mesh
        name="Escalera_Parante064"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante064.geometry}
        material={nodes.Escalera_Parante064.material}
        position={[2.017, 5.266, -21.226]}
        scale={0.246}
      />
      <mesh
        name="Escalera_Parante065"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante065.geometry}
        material={nodes.Escalera_Parante065.material}
        position={[2.017, 5.266, -28.618]}
        scale={0.246}
      />
      <mesh
        name="Escalera_Parante079"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante079.geometry}
        material={nodes.Escalera_Parante079.material}
        position={[2.011, 5.608, -21.822]}
        scale={0.246}
      />
      <mesh
        name="Escalera_Parante019"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante019.geometry}
        material={nodes.Escalera_Parante019.material}
        position={[2.041, 0.708, -8.389]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.246, 0.008, 0.246]}
      />
      <mesh
        name="Escalera_Parante020"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante020.geometry}
        material={nodes.Escalera_Parante020.material}
        position={[2.054, 0.048, -12.666]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.246, 0.008, 0.246]}
      />
      <mesh
        name="Escalera_Parante021"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante021.geometry}
        material={nodes.Escalera_Parante021.material}
        position={[3.439, 2.719, -12.31]}
        scale={1.105}
      />
      <mesh
        name="Escalera_Parante022"
        onClick={() => setCameraState("stairs")}
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante022.geometry}
        material={nodes.Escalera_Parante022.material}
        position={[1.685, 0.693, -9.513]}
        rotation={[Math.PI / 2, 0, -Math.PI / 2]}
      />
      <mesh
        name="Escalera_Parante023"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante023.geometry}
        material={nodes.Escalera_Parante023.material}
        position={[2.797, 1.862, -12.181]}
        scale={[0.88, 1.069, 1.076]}
      />
      <mesh
        name="Escalera_Parante024"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante024.geometry}
        material={nodes.Escalera_Parante024.material}
        position={[2.161, 2.185, -12.684]}
        rotation={[0.624, 0, 0]}
        scale={[2.21, 1.076, 1.09]}
      />
      <mesh
        name="Escalera_Parante025"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante025.geometry}
        material={nodes.Escalera_Parante025.material}
        position={[3.434, 2.185, -12.684]}
        rotation={[0.624, 0, 0]}
        scale={[2.21, 1.076, 1.09]}
      />
      <mesh
        name="Muro_Ext004"
        castShadow
        receiveShadow
        geometry={nodes.Muro_Ext004.geometry}
        material={nodes.Muro_Ext004.material}
        position={[2.384, 3.708, -5.837]}
        scale={1.105}
      />
      <mesh
        name="Muro_Ext005"
        castShadow
        receiveShadow
        geometry={nodes.Muro_Ext005.geometry}
        material={nodes.Muro_Ext005.material}
        position={[7.154, 1.67, -5.837]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        name="Escalera_Parante026"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante026.geometry}
        material={nodes.Escalera_Parante026.material}
        position={[4.119, 0.527, -5.879]}
        scale={1.105}
      />
      <mesh
        name="Muro_Exterior001"
        castShadow
        receiveShadow
        geometry={nodes.Muro_Exterior001.geometry}
        material={nodes.Muro_Exterior001.material}
        position={[1.864, 24.367, -45.249]}
        rotation={[0, 0, -Math.PI / 2]}
      />
      <mesh
        name="Plane007"
        castShadow
        receiveShadow
        geometry={nodes.Plane007.geometry}
        material={nodes.Plane007.material}
        position={[7.657, 5.271, -29.311]}
      />
      <mesh
        name="Plane009"
        castShadow
        receiveShadow
        geometry={nodes.Plane009.geometry}
        material={nodes.Plane009.material}
        position={[8.407, 3.469, -5.872]}
        rotation={[0, 0, -Math.PI / 2]}
        scale={0.1}
      />
      <mesh
        name="PB_Muro005"
        castShadow
        receiveShadow
        geometry={nodes.PB_Muro005.geometry}
        material={nodes.PB_Muro005.material}
        position={[8.591, 1.666, -19.208]}
      />
      <mesh
        name="PB_Muro006"
        castShadow
        receiveShadow
        geometry={nodes.PB_Muro006.geometry}
        material={nodes.PB_Muro006.material}
        position={[4.704, 1.665, -20.787]}
      />
      <mesh
        name="PB_Muro007"
        castShadow
        receiveShadow
        geometry={nodes.PB_Muro007.geometry}
        material={nodes.PB_Muro007.material}
        position={[7.205, 1.666, -7.543]}
        scale={1.105}
      />
      <mesh
        name="SM_BASEMENT"
        castShadow
        receiveShadow
        geometry={nodes.SM_BASEMENT.geometry}
        material={nodes.SM_BASEMENT.material}
        position={[8.591, 2.363, -19.082]}
      />
      <mesh
        name="PA_Muro003"
        castShadow
        receiveShadow
        geometry={nodes.PA_Muro003.geometry}
        material={nodes.PA_Muro003.material}
        position={[7.247, 7.088, -19.67]}
      />
      <mesh
        name="PA_Interior_Wall"
        castShadow
        receiveShadow
        geometry={nodes.PA_Interior_Wall.geometry}
        material={nodes.PA_Interior_Wall.material}
        position={[7.624, 4.918, -17.905]}
        rotation={[0, 0, -Math.PI]}
        scale={[-1, -1, -1.01]}
      />
      <mesh
        name="PA_Interior_Wall001"
        castShadow
        receiveShadow
        geometry={nodes.PA_Interior_Wall001.geometry}
        material={nodes.PA_Interior_Wall001.material}
        position={[7.624, 4.918, -20.579]}
        scale={[1, 1, 1.01]}
      />
      <mesh
        name="SM_Riel"
        castShadow
        receiveShadow
        geometry={nodes.SM_Riel.geometry}
        material={nodes.SM_Riel.material}
        position={[2.661, 6.624, -29.071]}
        scale={0.1}
      />
      <mesh
        name="PA_Baranda002"
        castShadow
        receiveShadow
        geometry={nodes.PA_Baranda002.geometry}
        material={nodes.PA_Baranda002.material}
        position={[8.072, 4.866, -13.95]}
        scale={0.055}
      />
      <mesh
        name="SM_PB_Floor"
        castShadow
        receiveShadow
        geometry={nodes.SM_PB_Floor.geometry}
        material={nodes.SM_PB_Floor.material}
        position={[7.537, 0, -24.093]}
      />
      <mesh
        name="Escalera_Parante030"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante030.geometry}
        material={nodes.Escalera_Parante030.material}
        position={[2.441, -2.748, -16.377]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      />
      <mesh
        name="Escalera_Parante031"
        castShadow
        receiveShadow
        geometry={nodes.Escalera_Parante031.geometry}
        material={nodes.Escalera_Parante031.material}
        position={[2.573, 0.473, -16.383]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      />
      <mesh
        name="arcade"
        onClick={() => setCameraState("arcade")}
        castShadow
        receiveShadow
        geometry={nodes.Accade001.geometry}
        material={nodes.Accade001.material}
        position={[2.937, 0.803, -14.205]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={0.954}
      />
      <mesh
        name="Door_Low"
        castShadow
        receiveShadow
        geometry={nodes.Door_Low.geometry}
        material={nodes.Door_Low.material}
        position={[8.076, 0.036, -5.776]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        name="SM_FloorPA"
        castShadow
        receiveShadow
        geometry={nodes.SM_FloorPA.geometry}
        material={nodes.SM_FloorPA.material}
        position={[6.33, 3.882, -28.613]}
        scale={0.177}
      />
      <mesh
        name="G-__559308"
        castShadow
        receiveShadow
        geometry={nodes["G-__559308"].geometry}
        material={nodes["G-__559308"].material}
        position={[5.483, 0, -14.609]}
        scale={[1.332, 1.666, 1.105]}
      />
      <mesh
        name="G-__555870"
        castShadow
        receiveShadow
        geometry={nodes["G-__555870"].geometry}
        material={nodes["G-__555870"].material}
        position={[4.51, 0.969, -5.827]}
        scale={[1.105, 0.856, 6.925]}
      />
      <mesh
        name="Plane011"
        castShadow
        receiveShadow
        geometry={nodes.Plane011.geometry}
        material={nodes.Plane011.material}
        position={[4.012, 2.254, -5.906]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <group>
        <mesh
          name="SM_PB_Glass"
          castShadow
          receiveShadow
          geometry={nodes.SM_PB_Glass.geometry}
          material={nodes.SM_PB_Glass.material}
          position={[4.195, 2.254, -14.641]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      </group>
      <group
        name="Basketball_hoop"
        position={[5.2, 3.404, -14.409]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={1.24}
        onClick={() => setCameraState("hoop")}
      >
        <mesh
          name="mount_01"
          castShadow
          receiveShadow
          geometry={nodes.mount_01.geometry}
          material={nodes.mount_01.material}
          position={[-0.001, 0.015, 0.329]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <mesh
            name="Bolt001"
            castShadow
            receiveShadow
            geometry={nodes.Bolt001.geometry}
            material={nodes.Bolt001.material}
            position={[0.023, 0.02, 0.001]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </mesh>
        <mesh
          name="mount_02"
          castShadow
          receiveShadow
          geometry={nodes.mount_02.geometry}
          material={nodes.mount_02.material}
          position={[-0.002, 0.26, 0.218]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <mesh
            name="Weld_4"
            castShadow
            receiveShadow
            geometry={nodes.Weld_4.geometry}
            material={nodes.Weld_4.material}
            position={[15.429, 6.302, 9.966]}
            scale={0.2}
          />
        </mesh>
        <mesh
          name="net"
          castShadow
          receiveShadow
          geometry={nodes.net.geometry}
          material={nodes.net.material}
          position={[-0.003, 0.261, 0.218]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
        <mesh
          name="ring"
          castShadow
          receiveShadow
          geometry={nodes.ring.geometry}
          material={nodes.ring.material}
          position={[-0.002, 0.26, 0.218]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
        <mesh
          name="shield"
          castShadow
          receiveShadow
          geometry={nodes.shield.geometry}
          material={nodes.shield.material}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </group>
      <mesh
        name="PA_Carpinteria028"
        castShadow
        receiveShadow
        geometry={nodes.PA_Carpinteria028.geometry}
        material={nodes.PA_Carpinteria028.material}
        position={[5.964, 6.634, -16.813]}
        scale={1.105}
      />
      <mesh
        name="PA_Carpinteria029"
        castShadow
        receiveShadow
        geometry={nodes.PA_Carpinteria029.geometry}
        material={nodes.PA_Carpinteria029.material}
        position={[5.964, 6.634, -18.403]}
        scale={1.105}
      />
      <mesh
        name="Glass003"
        castShadow
        receiveShadow
        geometry={nodes.Glass003.geometry}
        material={nodes.Glass003.material}
        position={[3.923, 5.302, -29.255]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        name="SM_PA_FrameWindows"
        castShadow
        receiveShadow
        geometry={nodes.SM_PA_FrameWindows.geometry}
        material={nodes.SM_PA_FrameWindows.material}
        position={[8.057, 4.288, -29.351]}
        scale={[0.893, 0.893, 2.799]}
      />
      <mesh
        name="Cube176"
        castShadow
        receiveShadow
        geometry={nodes.Cube176.geometry}
        material={nodes.Cube176.material}
        position={[8.069, 4.847, -21.561]}
        scale={[0.218, 0.032, 0.669]}
      />
      <mesh
        name="Cube175"
        castShadow
        receiveShadow
        geometry={nodes.Cube175.geometry}
        material={nodes.Cube175.material}
        position={[8.069, 4.847, -21.561]}
        scale={[0.218, 0.032, 0.669]}
      />
      <mesh
        name="Cube064"
        castShadow
        receiveShadow
        geometry={nodes.Cube064.geometry}
        material={nodes.Cube064.material}
        position={[7.996, 6.193, -21.564]}
        scale={[0.218, 0.032, 0.669]}
      />
      <mesh
        name="SM_Banco"
        castShadow
        receiveShadow
        geometry={nodes.SM_Banco.geometry}
        material={nodes.SM_Banco.material}
        position={[7.739, 4.132, -17.223]}
        scale={0.418}
      />
      <mesh
        name="G-__556005"
        castShadow
        receiveShadow
        geometry={nodes["G-__556005"].geometry}
        material={nodes["G-__556005"].material}
        position={[1.86, 3.703, -14.659]}
        scale={1.105}
      />
      <mesh
        name="TV009_Metal_0"
        castShadow
        receiveShadow
        geometry={nodes.TV009_Metal_0.geometry}
        material={nodes.TV009_Metal_0.material}
        position={[9.156, 0, -14.19]}
        rotation={[-Math.PI / 2, 0, -0.458]}
      />
    </group>
  );
};

useGLTF.preload("/models/misc/map.glb");
