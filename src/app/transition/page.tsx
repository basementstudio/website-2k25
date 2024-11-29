"use client";

import { Canvas, createPortal, useFrame } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useRef } from "react";
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
import { Environment, OrthographicCamera, useFBO } from "@react-three/drei";
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

interface TransitionRef {
  startTransition: (reverse: boolean) => void;
}

const Transition = forwardRef<TransitionRef>((_, ref) => {
  const progress = useRef(0);
  const isAnimating = useRef(false);
  const isReverse = useRef(false);

  // screen related
  const screenMesh = useRef<Mesh>(null!);
  const screenCamera = useRef<OrthographicCameraType>(null!);

  const router = useRouter();
  const setCameraState = useCameraStore((state) => state.setCameraState);

  const handleNavigation = (route: string, cameraState: CameraStateKeys) => {
    setCameraState(cameraState);
    router.push(route);
  };

  useImperativeHandle(ref, () => ({
    startTransition: (reverse: boolean) => {
      isAnimating.current = true;
      isReverse.current = reverse;
    },
  }));

  // scenes related
  const scene1 = new Scene();
  const scene2 = new Scene();
  const map = useRef<Mesh>(null!);

  const renderTargetA = useFBO();
  const renderTargetB = useFBO();

  useFrame((state) => {
    const { gl, camera } = state;

    // Update progress based on animation direction
    if (isAnimating.current) {
      if (isReverse.current) {
        progress.current -= 0.02; // Adjust speed as needed
        if (progress.current <= 0) {
          progress.current = 0;
          isAnimating.current = false;
        }
      } else {
        progress.current += 0.02; // Adjust speed as needed
        if (progress.current >= 1) {
          progress.current = 1;
          isAnimating.current = false;
        }
      }
    }

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
              value: 0.0,
            },
          }}
          vertexShader={planeVertexShader}
          fragmentShader={planeFragmentShader}
        />
      </mesh>
    </>
  );
});

Transition.displayName = "Transition";

const TransitionPage = () => {
  const transitionRef = useRef<TransitionRef>(null);
  const setCameraState = useCameraStore((state) => state.setCameraState);

  return (
    <div className="relative h-screen w-full">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}>
        <Transition ref={transitionRef} />
      </Canvas>
      <div
        className="absolute left-6 top-6 cursor-pointer bg-white p-2"
        onClick={() => {
          setCameraState("home");
          transitionRef.current?.startTransition(true);
        }}
      >
        <p>HOME</p>
      </div>
      <div
        className="absolute right-6 top-6 cursor-pointer bg-white p-2"
        onClick={() => {
          setCameraState("menu");
          transitionRef.current?.startTransition(false);
        }}
      >
        <p>MENU</p>
      </div>
    </div>
  );
};

export default TransitionPage;
