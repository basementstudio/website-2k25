"use client";

import { Map } from "@/components/map";
import { MapBlueprint } from "@/components/map-blueprint";
import { CameraStateKeys } from "@/store/app-store";
import { useCameraStore } from "@/store/app-store";
import { useFBO, OrthographicCamera, Environment } from "@react-three/drei";
import { Canvas, useFrame, useThree, createPortal } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useRef, useMemo, useState } from "react";
import * as THREE from "three";
import { planeFragmentShader } from "./fragment";
import { planeVertexShader } from "./vertex";

const Drawing = ({ isTransitioning }) => {
  const plane = useRef<THREE.Mesh>(null!);
  const finalCamera = useRef<THREE.OrthographicCamera>(null!);
  const blueprintCamera = useRef<THREE.OrthographicCamera>(null!);
  const transitionProgress = useRef(0);
  const [isFirstScene, setIsFirstScene] = useState(true);

  const finalFBO = useFBO();
  const blueprintSceneFBO = useFBO();

  const { viewport } = useThree();

  const finalScene = useMemo(() => new THREE.Scene(), []);
  const blueprintScene = useMemo(() => new THREE.Scene(), []);

  const planeUniforms = useMemo(
    () => ({
      uTextureA: {
        value: null,
      },
      uTextureB: {
        value: null,
      },
      uTransition: {
        value: 0,
      },
      winResolution: {
        value: new THREE.Vector2(
          window.innerWidth,
          window.innerHeight,
        ).multiplyScalar(Math.min(window.devicePixelRatio, 2)),
      },
    }),
    [],
  );

  useFrame((state, delta) => {
    // Set up both cameras
    const setupCamera = (camera: THREE.OrthographicCamera) => {
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      camera.zoom = 40;

      camera.updateProjectionMatrix();
    };

    setupCamera(finalCamera.current);
    setupCamera(blueprintCamera.current);

    if (isTransitioning.current) {
      const targetValue = isFirstScene ? 1 : 0;
      const direction = isFirstScene ? 1 : -1;

      transitionProgress.current += delta * 0.5 * direction;
      transitionProgress.current = Math.max(
        0,
        Math.min(1, transitionProgress.current),
      );

      (
        plane.current.material as THREE.ShaderMaterial
      ).uniforms.uTransition.value = transitionProgress.current;

      if (
        (direction > 0 && transitionProgress.current >= targetValue) ||
        (direction < 0 && transitionProgress.current <= targetValue)
      ) {
        setIsFirstScene(!isFirstScene);
        isTransitioning.current = false;
      }
    }

    const { gl } = state;

    gl.setRenderTarget(finalFBO);
    gl.render(finalScene, finalCamera.current);

    blueprintScene.background = new THREE.Color("#1B43BA");
    gl.setRenderTarget(blueprintSceneFBO);
    gl.render(blueprintScene, blueprintCamera.current);

    (plane.current.material as THREE.ShaderMaterial).uniforms.uTextureA.value =
      blueprintSceneFBO.texture;
    (plane.current.material as THREE.ShaderMaterial).uniforms.uTextureB.value =
      finalFBO.texture;
    (
      plane.current.material as THREE.ShaderMaterial
    ).uniforms.winResolution.value = new THREE.Vector2(
      window.innerWidth,
      window.innerHeight,
    ).multiplyScalar(Math.min(window.devicePixelRatio, 2));

    gl.setRenderTarget(null);
  });

  const router = useRouter();
  const setCameraState = useCameraStore((state) => state.setCameraState);

  const handleNavigation = (route: string, cameraState: CameraStateKeys) => {
    setCameraState(cameraState);
    router.push(route);
  };

  return (
    <>
      {/* Final Scene */}
      {createPortal(
        <>
          <OrthographicCamera
            ref={finalCamera}
            makeDefault
            position={[10, 10, 10]}
            zoom={40}
            near={0.01}
            far={100}
          />
          <color attach="background" args={["#000"]} />
          <Environment preset="night" />
          <Map handleNavigation={handleNavigation} />
        </>,
        finalScene,
      )}
      {/* Blueprint scene */}
      {createPortal(
        <>
          <OrthographicCamera
            ref={blueprintCamera}
            makeDefault
            position={[10, 10, 10]}
            zoom={40}
            near={0.01}
            far={100}
          />
          <color attach="background" args={["red"]} />
          <Environment preset="sunset" />
          <MapBlueprint />
        </>,
        blueprintScene,
      )}
      <mesh ref={plane} scale={[viewport.width, viewport.height, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          fragmentShader={planeFragmentShader}
          vertexShader={planeVertexShader}
          uniforms={planeUniforms}
        />
      </mesh>
    </>
  );
};

const BasketballPage = () => {
  const isTransitioning = useRef(false);

  const handleTransition = () => {
    if (!isTransitioning.current) {
      isTransitioning.current = true;
    }
  };

  return (
    <div className="relative h-screen w-full">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
        <Drawing isTransitioning={isTransitioning} />
      </Canvas>
      <button
        className="absolute right-6 top-6 bg-white p-2"
        onClick={handleTransition}
      >
        MENU
      </button>
    </div>
  );
};

export default BasketballPage;
