import { PropsWithChildren, useEffect, useMemo } from "react";
import { RenderTexture } from "../render-texture";
import { useUniforms } from "../../../../hooks/use-uniforms";
import { DrawUniforms, drawMaterial, drawPass } from "./draw-pass";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, BloomEffect, EffectPass } from "postprocessing";
import { HalfFloatType } from "three";

/** This component handles rendering and postprocessing */
export const Renderer = ({ children }: PropsWithChildren<{}>) => {
  const [, setRenderUniforms] = useUniforms<DrawUniforms>(
    {
      mainFbo: null,
    },
    {
      syncShader: drawMaterial,
    }
  );

  const gl = useThree((state) => state.gl);

  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);

  const renderer = useMemo(() => {
    const composer = new EffectComposer(gl, {
      frameBufferType: HalfFloatType,
    });

    composer.multisampling = 4;

    composer.addPass(drawPass);
    // composer.addPass(gammaPass);
    const bloomEffect = new BloomEffect({
      mipmapBlur: false,
      intensity: 0.5,
      levels: 10,
      radius: 0.01,
      luminanceThreshold: 0.5,
      luminanceSmoothing: 0.9,
    });
    composer.addPass(new EffectPass(undefined, bloomEffect));

    return {
      composer,
      drawPass,
      // bloomEffect,
    };
  }, [gl]);

  useFrame(() => {
    renderer.composer.render();
  }, 1);

  useEffect(() => {
    renderer.composer.setSize(width, height);
  }, [width, height, renderer]);

  return (
    <RenderTexture
      width={width}
      height={height}
      onMapTexture={(mainFbo) => {
        setRenderUniforms({ mainFbo });
      }}
    >
      {children}
    </RenderTexture>
  );
};
