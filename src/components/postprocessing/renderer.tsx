import { createPortal, useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Scene, WebGLRenderTarget } from "three";
import { PostProcessing } from "./post-processing";
import { useCameraStore } from "@/store/app-store";

interface RendererProps {
  sceneChildren: React.ReactNode;
}

export function Renderer({ sceneChildren }: RendererProps) {
  const activeCamera = useCameraStore((state) => state.activeCamera);

  const mainTarget = useMemo(
    () => new WebGLRenderTarget(window.innerWidth, window.innerHeight),
    [],
  );
  const ditheringTarget = useMemo(
    () => new WebGLRenderTarget(window.innerWidth, window.innerHeight),
    [],
  );

  const mainScene = useMemo(() => new Scene(), []);
  const postProcessingScene = useMemo(() => new Scene(), []);

  const sceneCamera = useCameraStore((state) => state.camera);
  const orbitCamera = useCameraStore((state) => state.orbitCamera);
  const postProcessingCamera = useCameraStore(
    (state) => state.postProcessingCamera,
  );

  const cameraToRender = useMemo(() => {
    // debug orbit camera
    if (activeCamera === "debug-orbit") return orbitCamera;
    // render main camera
    return sceneCamera;
  }, [sceneCamera, orbitCamera, activeCamera]);

  useEffect(() => {
    const resizeCallback = () => {
      mainTarget.setSize(window.innerWidth, window.innerHeight);
      ditheringTarget.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", resizeCallback);
    return () => window.removeEventListener("resize", resizeCallback);
  }, [mainTarget, ditheringTarget]);

  useFrame(({ gl }) => {
    if (!cameraToRender || !postProcessingCamera) return;

    gl.setRenderTarget(mainTarget);
    // save render on main target
    gl.render(mainScene, cameraToRender);

    gl.setRenderTarget(null);
    gl.render(postProcessingScene, postProcessingCamera);
  }, 1);

  return (
    <>
      {createPortal(sceneChildren, mainScene)}

      {createPortal(
        <PostProcessing mainTexture={mainTarget.texture} />,
        postProcessingScene,
      )}
    </>
  );
}
