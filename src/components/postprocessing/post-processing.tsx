import { useCameraStore } from "@/store/app-store";
import { PerspectiveCamera } from "@react-three/drei";
import { ShaderMaterial, Vector2, Texture } from "three";
import { useControls } from "leva";

import postVert from "./post.vert";
import postFrag from "./post.frag";
import { useEffect } from "react";

interface PostProcessingProps {
  mainTexture: Texture;
}

const material = new ShaderMaterial({
  vertexShader: postVert,
  fragmentShader: postFrag,
  uniforms: {
    uMainTexture: { value: null },
    uEnableShader: { value: true },
    aspect: { value: 1 },
    screenSize: { value: new Vector2(1, 1) },
    dpr: { value: 1 },
    uPixelSize: { value: 1.0 },
    uColorNum: { value: 6.0 },
    uBayerSize: { value: 4 },
    uTolerance: { value: 0.01 },
  },
});

const calculateFov = (z: number) => {
  return Math.atan(1 / z) * (180 / Math.PI);
};

export function PostProcessing({ mainTexture }: PostProcessingProps) {
  const { pixelSize, colorNum, bayerSize, enableShader, tolerance } =
    useControls({
      enableShader: { value: true },
      pixelSize: { value: 1, min: 1, max: 16, step: 0.5 },
      colorNum: { value: 4, min: 2, max: 32, step: 0.5 },
      bayerSize: {
        options: {
          "2x2": 2,
          "4x4": 4,
          "8x8": 8,
        },
      },
      tolerance: { value: 0.05, min: 0, max: 0.5, step: 0.01 },
    });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio;
      material.uniforms.screenSize.value.set(width, height);
      material.uniforms.dpr.value = dpr;
      material.uniforms.aspect.value = width / height;
    };

    resize();
    window.addEventListener("resize", resize, { signal });

    material.uniforms.uMainTexture.value = mainTexture;
    material.uniforms.uEnableShader.value = enableShader;
    material.uniforms.uPixelSize.value = pixelSize;
    material.uniforms.uColorNum.value = colorNum;
    material.uniforms.uBayerSize.value = bayerSize;
    material.uniforms.uTolerance.value = tolerance;
    return () => {
      controller.abort();
    };
  }, [mainTexture, enableShader, pixelSize, colorNum, bayerSize, tolerance]);

  return (
    <>
      <PerspectiveCamera
        manual
        position={[0, 0, 10]}
        aspect={1}
        fov={calculateFov(10)}
        ref={(r) => {
          if (r) useCameraStore.setState({ postProcessingCamera: r });
        }}
      />
      <mesh>
        <planeGeometry args={[1, 1]} />
        <primitive object={material} attach="material" />
      </mesh>
    </>
  );
}
