import { Color, DoubleSide, MeshStandardMaterial, ShaderMaterial } from "three";
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";

export const createShaderMaterial = (
  baseMaterial: MeshStandardMaterial,
  reverse: boolean,
) => {
  const {
    color: baseColor = new Color(0, 1, 1),
    map: baseMap = null,
    opacity: baseOpacity = 1.0,
  } = baseMaterial;

  const emissiveColor = new Color("#FF4D00").multiplyScalar(9);

  const material = new ShaderMaterial({
    name: "reveal-solid-shader",
    uniforms: {
      uColor: { value: emissiveColor },
      uProgress: { value: 0.0 },
      uReverse: { value: reverse },
      baseColorMap: { value: baseMap },
      baseColor: { value: baseColor },
      opacity: { value: baseOpacity },
      noiseFactor: { value: 0.5 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    side: DoubleSide,
  });

  material.needsUpdate = true;
  material.customProgramCacheKey = () => "reveal-solid-shader";

  return material;
};
