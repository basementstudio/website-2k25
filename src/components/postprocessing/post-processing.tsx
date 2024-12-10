import { useCameraStore } from "@/store/app-store";
import { PerspectiveCamera } from "@react-three/drei";
import { ShaderMaterial, Vector2, Texture } from "three";

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
    uDitheringTexture: { value: null },
    uDisablePostprocessing: { value: false },
    aspect: { value: 1 },
    screenSize: { value: new Vector2(1, 1) },
    dpr: { value: 1 },
  },
});

const calculateFov = (z: number) => {
  return Math.atan(1 / z) * (180 / Math.PI);
};

export function PostProcessing({ mainTexture }: PostProcessingProps) {
  const disablePostprocessing = useCameraStore(
    (state) => state.disablePostprocessing,
  );

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
    material.uniforms.uDisablePostprocessing.value = disablePostprocessing;

    return () => {
      controller.abort();
    };
  }, [mainTexture, disablePostprocessing]);

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
