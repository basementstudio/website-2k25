import { Color, DoubleSide, MeshStandardMaterial, ShaderMaterial } from "three";

export const CreateShaderMaterial = (baseMaterial: MeshStandardMaterial) => {
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
    uniforms: {
      uThickness: { value: null },
      uColor: { value: emissiveColor },
      uProgress: { value: 0.0 },
      uPixelSize: { value: 8 },
      baseColorMap: { value: baseMap },
      baseColor: { value: baseColor },
      opacity: { value: baseOpacity },
    },
    vertexShader: `
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
    fragmentShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        uniform vec3 uColor;
        uniform float uProgress;
        uniform vec3 baseColor;
        uniform sampler2D baseColorMap;
        uniform float opacity;
        
        void main() {
           
            // Combine texture and base color
            vec3 color = texture2D(baseColorMap, vUv).rgb;
          
            
            //gl_FragColor = vec4(color, opacity * (1.0 - wave));
            gl_FragColor = vec4(vec3(color), 1.0);
        }
    `,
    transparent: true,
    side: DoubleSide,
  });

  material.needsUpdate = true;
  material.customProgramCacheKey = () => {
    return Math.random().toString();
  };

  return material;
};
