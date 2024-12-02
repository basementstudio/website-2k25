"use client";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, ShaderMaterial, Vector3 } from "three";
import path from "../../../public/paths/mapv2.json";
import { Color } from "three";
import { useRef } from "react";

export const LineObject = () => {
  const points = path.points.map(
    (point) => new Vector3(point.x, point.y, point.z),
  );
  const geometry = new BufferGeometry().setFromPoints(points);

  const uniforms = {
    uProgress: { value: 0.0 },
    uColor: { value: new Color(0xff0000) },
    uOpacity: { value: 1.0 },
  };

  const shaderMaterial = new ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        
        void main() {
          vPosition = position;
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;
          
          vWorldPosition = modelPosition.xyz;
          gl_Position = projectedPosition;
        }
      `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uProgress;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;
  
      void main() {
        float dist = distance(vWorldPosition.xz, vec2(2.0, -16.0));
        float radialMove = step(dist, uProgress * 14.0);
        
        float borderWidth = 0.1;
        float borderEdge = step(dist, uProgress * 14.0 + borderWidth) - radialMove;
        
        float finalAlpha = mix(0.0, uOpacity, radialMove); // Inverted the mix parameters
        
        vec3 scanColor = vec3(0.0, 0.2, 1.0);
        vec3 borderColor = vec3(0.0, 0.1, 0.8);
        
        vec3 finalColor = mix(uColor, borderColor, borderEdge * 0.8);
        
        gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `,
    transparent: true,
  });

  const progressRef = useRef(0.0);

  useFrame((_state, delta) => {
    progressRef.current = (progressRef.current + delta * 0.1) % 1.0;
    shaderMaterial.uniforms.uProgress.value = progressRef.current;
  });

  return <lineSegments geometry={geometry} material={shaderMaterial} />;
};
