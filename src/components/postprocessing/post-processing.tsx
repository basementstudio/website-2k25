import { useCameraStore } from "@/store/app-store";
import { PerspectiveCamera } from "@react-three/drei";
import { ShaderMaterial, Vector2, Texture, TextureLoader } from "three";
import { useControls } from "leva";
import * as THREE from "three";
import { useEffect, useRef } from "react";

import postVert from "./post.vert";
import postFrag from "./post.frag";

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
    uColorNum: { value: 18.0 },
    uBayerSize: { value: 4 },
    uTolerance: { value: 0.25 },
    uBrightness: { value: 1.0 },
    uPreserveColors: { value: true },
    uDitherPattern: { value: 0 },
    uBrightnessThreshold: { value: 0.98 },
    uBayerTexture: { value: null },
  },
});

export function PostProcessing({ mainTexture }: PostProcessingProps) {
  const bayer8TextureRef = useRef<THREE.Texture | null>(null);

  const { pixelSize, bayerSize, enableShader } = useControls({
    enableShader: { value: true },
    pixelSize: { value: 1, min: 1.0, max: 32.0, step: 1.0 },
    bayerSize: {
      value: 8,
      options: {
        "8x8": 8,
        "16x16": 16,
      },
    },
  });

  useEffect(() => {
    const texture = new TextureLoader().load("/textures/bayer8x8.png");
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    bayer8TextureRef.current = texture;

    return () => {
      if (bayer8TextureRef.current) {
        bayer8TextureRef.current.dispose();
      }
    };
  }, []);

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
    material.uniforms.uBayerSize.value = bayerSize;
    material.uniforms.uBayerTexture.value = bayer8TextureRef.current;

    return () => {
      controller.abort();
    };
  }, [mainTexture, enableShader, pixelSize, bayerSize]);

  const calculateFov = (z: number) => {
    return Math.atan(1 / z) * (180 / Math.PI);
  };

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
