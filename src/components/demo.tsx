"use client";

import { Canvas } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Mesh } from "three";
import {
  OrbitControls,
  Stars,
  MeshDistortMaterial,
  GradientTexture,
  Float,
  Sparkles,
} from "@react-three/drei";

interface FloatingSphereProps {
  position: [number, number, number];
}

const FloatingSphere = ({ position }: FloatingSphereProps) => {
  const meshRef = useRef<Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
    meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime) * 0.1;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh
        ref={meshRef}
        position={position}
        scale={hovered ? 1.2 : 1}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial speed={3} distort={hovered ? 0.6 : 0.4} radius={1}>
          <GradientTexture
            stops={[0, 0.5, 1]}
            colors={["#f7b0ff", "#7f00ff", "#4c00ff"]}
          />
        </MeshDistortMaterial>
      </mesh>
    </Float>
  );
};

const GlowingRing = () => {
  const meshRef = useRef<Mesh>(null!);

  useFrame((state) => {
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    meshRef.current.rotation.y += 0.002;
    meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.2) * 0.1;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <torusGeometry args={[4, 0.15, 32, 100]} />
      <meshStandardMaterial
        color="#ff00ff"
        emissive="#ff00ff"
        emissiveIntensity={0.5}
        metalness={1}
        roughness={0}
      />
    </mesh>
  );
};

export const Demo = () => (
  <div className="aspect-square w-full max-w-screen-sm overflow-hidden rounded-xl">
    <Canvas camera={{ position: [0, 0, 10] }}>
      <color attach="background" args={["#090014"]} />

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        color="#fff"
      />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#0055ff" />
      <pointLight position={[10, -10, 10]} intensity={1} color="#ff0055" />

      {/* Particles */}
      <Stars
        radius={50}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      <Sparkles count={100} scale={12} size={6} speed={0.4} color="#ff69b4" />

      {/* Objects */}
      <GlowingRing />
      <FloatingSphere position={[-2.5, 0, 0]} />
      <FloatingSphere position={[2.5, 0, 0]} />

      {/* Controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        minDistance={8}
        maxDistance={20}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </Canvas>
  </div>
);
