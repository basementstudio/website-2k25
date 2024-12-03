import { Color, DoubleSide, MeshStandardMaterial, ShaderMaterial } from "three";

export const createShaderMaterial = (baseMaterial: MeshStandardMaterial) => {
  const baseColor =
    (baseMaterial as MeshStandardMaterial).color || new Color(1, 1, 1);
  const baseMap = (baseMaterial as MeshStandardMaterial).map || null;
  const baseOpacity =
    (baseMaterial as MeshStandardMaterial).opacity !== undefined
      ? (baseMaterial as MeshStandardMaterial).opacity
      : 1.0;

  const emissiveColor = new Color("#ff660a");
  emissiveColor.multiplyScalar(9);

  const material = new ShaderMaterial({
    name: "reveal-solid-shader",
    uniforms: {
      uThickness: { value: null },
      uColor: { value: emissiveColor },
      uProgress: { value: 0.5 },
      uPixelSize: { value: 8 },
      baseColorMap: { value: baseMap },
      baseColor: { value: baseColor },
      opacity: { value: baseOpacity },
    },
    vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        void main() {
        vUv = uv;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;

        gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        uniform vec3 uColor;
        uniform float uProgress;
        uniform vec3 baseColor;
        uniform sampler2D baseColorMap;
        uniform float opacity;
        
        void main() {
            // Distance from center
            vec3 voxelCenter = round(vWorldPosition * 10.) / 10.;
            // float randomOffset = noise3(voxelCenter);

            float dist = distance(voxelCenter, vec3(2.0, 0., -16.0));
            // dist += randomOffset;

            // Wave effect
            float wave = step(dist, uProgress * 14.0);
            float edge = step(dist, uProgress * 14.0 + 0.2) - wave;
            // Combine texture and base color
            vec3 color = baseColor * texture2D(baseColorMap, vUv).rgb;
            // Apply wave effect
            color = mix(color, uColor * wave + uColor * edge, wave + edge);

            float opacityResult = 1.0 - wave;
            opacityResult *= opacity;
            opacityResult = clamp(opacityResult, 0.0, 1.0);

            if (opacityResult <= 0.0) {
              discard;
            }

            gl_FragColor = vec4(color, opacityResult);
        }
    `,
    transparent: true,
    side: DoubleSide,
  });

  material.needsUpdate = true;
  // material.customProgramCacheKey = () => "reveal-solid-shader";

  return material;
};
