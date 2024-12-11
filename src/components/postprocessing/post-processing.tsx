import { useCameraStore } from "@/store/app-store";
import { PerspectiveCamera } from "@react-three/drei";
import { ShaderMaterial, Vector2, Texture, TextureLoader } from "three";
import { useControls } from "leva";
import * as THREE from "three";

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

const bayer8Texture = new TextureLoader().load("/textures/bayer8x8.png");
bayer8Texture.minFilter = THREE.NearestFilter;
bayer8Texture.magFilter = THREE.NearestFilter;

const calculateFov = (z: number) => {
  return Math.atan(1 / z) * (180 / Math.PI);
};

export function PostProcessing({ mainTexture }: PostProcessingProps) {
  const {
    pixelSize,
    // colorNum,
    bayerSize,
    enableShader,
    // tolerance,
    // brightness,
    // ditherPattern,
    // preserveColors,
    // brightnessThreshold,
  } = useControls({
    enableShader: { value: true },
    pixelSize: { value: 1, min: 1.0, max: 32.0, step: 2.0 },
    // colorNum: { value: 18.0, min: 2, max: 32, step: 0.5 },
    bayerSize: {
      value: 8,
      options: {
        // "2x2": 2,
        // "4x4": 4,
        "8x8": 8,
        "16x16": 16,
      },
    },
    // tolerance: { value: 0.25, min: 0, max: 0.5, step: 0.01 },
    // brightness: { value: 1.0, min: 0, max: 2, step: 0.01 },
    // ditherPattern: {
    //   value: 0,
    //   options: {
    //     Bayer: 0,
    //     CrossHatch: 1,
    //   },
    //   label: "Dither Pattern",
    // },
    // preserveColors: {
    //   value: true,
    //   label: "Preserve Colors",
    // },
    // brightnessThreshold: { value: 0.98, min: 0, max: 1, step: 0.01 },
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
    // material.uniforms.uColorNum.value = colorNum;
    material.uniforms.uBayerSize.value = bayerSize;
    // material.uniforms.uTolerance.value = tolerance;
    // material.uniforms.uBrightness.value = brightness;
    // material.uniforms.uPreserveColors.value = preserveColors;
    // material.uniforms.uDitherPattern.value = ditherPattern;
    // material.uniforms.uBrightnessThreshold.value = brightnessThreshold;
    material.uniforms.uBayerTexture.value = bayer8Texture;
    return () => {
      controller.abort();
    };
  }, [
    mainTexture,
    enableShader,
    pixelSize,
    // colorNum,
    bayerSize,
    // tolerance,
    // brightness,
    // preserveColors,
    // ditherPattern,
    // brightnessThreshold,
  ]);

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
