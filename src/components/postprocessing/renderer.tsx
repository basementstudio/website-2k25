import { createPortal, useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Scene, WebGLRenderTarget } from "three";
import { PostProcessing } from "./post-processing";
import { useCameraStore } from "@/store/app-store";

interface RendererProps {
  sceneChildren: React.ReactNode;
}

export function Renderer({ sceneChildren }: RendererProps) {
  const mainTarget = useMemo(
    () => new WebGLRenderTarget(window.innerWidth, window.innerHeight),
    [],
  );
  const ditheringTarget = useMemo(
    () => new WebGLRenderTarget(window.innerWidth, window.innerHeight),
    [],
  );

  const mainScene = useMemo(() => new Scene(), []);
  const ditheringScene = useMemo(() => new Scene(), []);
  const postProcessingScene = useMemo(() => new Scene(), []);

  const postProcessingCamera = useCameraStore(
    (state) => state.postProcessingCamera,
  );

  useEffect(() => {
    const resizeCallback = () => {
      mainTarget.setSize(window.innerWidth, window.innerHeight);
      ditheringTarget.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", resizeCallback);
    return () => window.removeEventListener("resize", resizeCallback);
  }, [mainTarget, ditheringTarget]);

  useFrame(({ gl, camera }) => {
    if (!postProcessingCamera) return;

    // Render main scene with main camera
    gl.setRenderTarget(mainTarget);
    gl.render(mainScene, camera);

    // Render dithering scene with main camera
    gl.setRenderTarget(ditheringTarget);
    gl.render(ditheringScene, camera);

    // Final composite with post-processing camera
    gl.setRenderTarget(null);
    gl.render(postProcessingScene, postProcessingCamera);
  }, 1);

  return (
    <>
      {createPortal(sceneChildren, mainScene)}
      {createPortal(sceneChildren, ditheringScene)}
      {createPortal(
        <PostProcessing
          mainTexture={mainTarget.texture}
          ditheringTexture={ditheringTarget.texture}
        />,
        postProcessingScene,
      )}
    </>
  );
}
