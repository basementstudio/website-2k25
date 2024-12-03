import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, ShaderMaterial } from "three";

export const CustomShaderMaterial = () => {
  const materialRef = useRef<ShaderMaterial | null>(null);
  const uniforms = useMemo(
    () => ({
      u_time: {
        value: 0.0,
      },
      u_colorA: { value: new Color("#FFE486") },
      u_colorB: { value: new Color("#FEB3D9") },
    }),
    [],
  );

  useFrame((state) => {
    const { clock } = state;
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
    }
  });

  return (
    <shaderMaterial
      ref={materialRef}
      fragmentShader={`
        uniform vec3 u_colorA;
        uniform vec3 u_colorB;
        varying float vZ;
  
        void main() {
          vec3 color = mix(u_colorA, u_colorB, vZ * 2.0 + 0.5); 
          gl_FragColor = vec4(color, 1.0);
        }
      `}
      vertexShader={`
        uniform float u_time;
        varying float vZ;
  
        void main() {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          
          modelPosition.y += sin(modelPosition.x * 5.0 + u_time * 3.0) * 0.1;
          modelPosition.y += sin(modelPosition.z * 6.0 + u_time * 2.0) * 0.1;
          
          vZ = modelPosition.y;
  
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;
  
          gl_Position = projectedPosition;
        }
      `}
      uniforms={uniforms}
      wireframe={false}
    />
  );
};
