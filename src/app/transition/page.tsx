"use client";

import { Canvas, createPortal, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { planeFragmentShader } from "./fragment";
import { planeVertexShader } from "./vertex";

import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  Scene,
  ShaderMaterial,
  type OrthographicCamera as OrthographicCameraType,
} from "three";
import {
  Environment,
  OrbitControls,
  OrthographicCamera,
  useFBO,
} from "@react-three/drei";
import { Map } from "@/components/map";
import { MapBlueprint } from "@/components/map-blueprint";
import { CustomCamera } from "@/components/camera-controls";
import { useCameraStore } from "@/store/app-store";
import { CameraStateKeys } from "@/store/app-store";
import { useRouter } from "next/navigation";

const getFullscreenTriangle = () => {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
  );
  geometry.setAttribute(
    "uv",
    new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2),
  );

  return geometry;
};

const Transition = () => {
  const progress = useRef(-1);
  // screen related
  const screenMesh = useRef<Mesh>(null!);
  const screenCamera = useRef<OrthographicCameraType>(null!);

  const router = useRouter();
  const setCameraState = useCameraStore((state) => state.setCameraState);

  const handleNavigation = (route: string, cameraState: CameraStateKeys) => {
    setCameraState(cameraState);
    router.push(route);
  };

  // scenes related
  const scene1 = new Scene();
  const scene2 = new Scene();
  const map = useRef<Mesh>(null!);

  const renderTargetA = useFBO();
  const renderTargetB = useFBO();

  useFrame((state) => {
    const { gl, camera, clock } = state;
    progress.current = Math.sin(clock.getElapsedTime() * 1.5);

    gl.setRenderTarget(renderTargetA);
    gl.render(scene1, camera);

    gl.setRenderTarget(renderTargetB);
    gl.render(scene2, camera);

    const material = screenMesh.current.material as ShaderMaterial;
    material.uniforms.textureA.value = renderTargetA.texture;
    material.uniforms.textureB.value = renderTargetB.texture;
    material.uniforms.uProgress.value = progress.current;

    gl.setRenderTarget(null);
  });

  return (
    <>
      <CustomCamera />
      {createPortal(
        <>
          <color attach="background" args={["#000"]} />
          <directionalLight position={[10, 10, 0]} intensity={1} />
          <ambientLight intensity={1} />
          <Environment preset="sunset" />
          <mesh ref={map} position={[2, 0, 0]}>
            <Map handleNavigation={handleNavigation} />
          </mesh>
        </>,
        scene1,
      )}
      {createPortal(
        <>
          <color attach="background" args={["#14181D"]} />
          <directionalLight position={[0, 0, -10]} intensity={1} />
          <ambientLight intensity={1} />
          <Environment preset="sunset" />
          <mesh ref={map} position={[2, 0, 0]}>
            <MapBlueprint />
          </mesh>
        </>,
        scene2,
      )}
      <OrthographicCamera
        ref={screenCamera}
        args={[-1, 1, 1, -1, -1, 1]}
        position={[0, 0, 0.1]}
      />

      <mesh
        ref={screenMesh}
        geometry={getFullscreenTriangle()}
        frustumCulled={false}
      >
        <shaderMaterial
          transparent
          uniforms={{
            textureA: {
              value: renderTargetA.texture,
            },
            textureB: {
              value: renderTargetB.texture,
            },
            uTime: {
              value: 1.0,
            },
            uProgress: {
              value: -0.0,
            },
          }}
          vertexShader={planeVertexShader}
          fragmentShader={planeFragmentShader}
        />
      </mesh>
    </>
  );
};

const TransitionPage = () => {
  const setCameraState = useCameraStore((state) => state.setCameraState);
  return (
    <div className="relative h-screen w-full">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}>
        <Transition />
      </Canvas>
      <div
        className="absolute left-6 top-6 cursor-pointer bg-white p-2"
        onClick={() => setCameraState("home")}
      >
        <p>HOME</p>
      </div>
      <div
        className="absolute right-6 top-6 cursor-pointer bg-white p-2"
        onClick={() => setCameraState("menu")}
      >
        <p>MENU</p>
      </div>
    </div>
  );
};

export default TransitionPage;
