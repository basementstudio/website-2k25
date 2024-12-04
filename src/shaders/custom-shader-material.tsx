import { Color, DoubleSide, MeshStandardMaterial, ShaderMaterial } from "three";
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";

export const createShaderMaterial = (
  baseMaterial: MeshStandardMaterial,
  reverse: boolean,
) => {
  const baseColor =
    (baseMaterial as MeshStandardMaterial).color || new Color(0, 1, 1);
  const baseMap = (baseMaterial as MeshStandardMaterial).map || null;
  const baseOpacity =
    (baseMaterial as MeshStandardMaterial).opacity !== undefined
      ? (baseMaterial as MeshStandardMaterial).opacity
      : 1.0;

  const emissiveColor = new Color("#2D30FB");
  emissiveColor.multiplyScalar(9);

  const material = new ShaderMaterial({
    name: "reveal-solid-shader",
    uniforms: {
      uColor: { value: emissiveColor },
      uProgress: { value: 0.4 },
      uReverse: { value: reverse },
      baseColorMap: { value: baseMap },
      baseColor: { value: baseColor },
      opacity: { value: baseOpacity },
      noiseFactor: { value: 0.5 },
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    side: DoubleSide,
  });

  material.needsUpdate = true;
  material.customProgramCacheKey = () => "reveal-solid-shader";

  return material;
};
