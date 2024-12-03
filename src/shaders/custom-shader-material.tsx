import { useMemo } from "react";
import { Color, DoubleSide, MeshStandardMaterial, ShaderMaterial } from "three";

export function CustomShaderMaterial({
  baseMaterial,
}: {
  baseMaterial: MeshStandardMaterial;
}) {
  const customMaterial = useMemo(() => {
    const baseColor =
      (baseMaterial as MeshStandardMaterial).color || new Color(1, 1, 1);
    const baseMap = (baseMaterial as MeshStandardMaterial).map || null;
    const baseOpacity =
      (baseMaterial as MeshStandardMaterial).opacity !== undefined
        ? (baseMaterial as MeshStandardMaterial).opacity
        : 1.0;

    const emissiveColor = new Color("#ff660a");
    emissiveColor.multiplyScalar(9);

    return new ShaderMaterial({
      uniforms: {
        uThickness: { value: 0.08 },
        uColor: { value: emissiveColor },
        uProgress: { value: 0 },
        uPixelSize: { value: 8 },
        baseColorMap: { value: baseMap },
        baseColor: { value: baseColor },
        opacity: { value: baseOpacity },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        uniform vec2 pixels;

        void main() {
          vUv = uv;
          vec3 mvPosition = modelViewMatrix * vec4(position, 1.0);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
      `,
      transparent: true,
      side: DoubleSide,
    });
  }, [baseMaterial]);

  return customMaterial;
}
