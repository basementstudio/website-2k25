import { useMemo } from "react"
import { CylinderGeometry, ShaderMaterial, SphereGeometry } from "three"

import { PUMPKINS } from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { lightFlickerUniform } from "@/shaders/material-global-shader"

import frag from "./frag.glsl"
import vert from "./vert.glsl"

export const HalloweenPumpkins = () => {
  const bodyGeometry = useMemo(() => new SphereGeometry(1, 40, 28), [])
  const stemGeometry = useMemo(() => {
    const geometry = new CylinderGeometry(0.09, 0.14, 0.26, 8)
    geometry.translate(0, 0.86, 0)
    return geometry
  }, [])
  // One material per pumpkin so each candle flickers out of step.
  const materials = useMemo(
    () =>
      PUMPKINS.map(
        (pumpkin) =>
          new ShaderMaterial({
            vertexShader: vert,
            fragmentShader: frag,
            uniforms: {
              uTime: { value: 0 },
              uSeed: { value: pumpkin.seed },
              uLightFlicker: lightFlickerUniform
            }
          })
      ),
    []
  )

  useFrameCallback((_, __, time) => {
    for (const own of materials) own.uniforms.uTime.value = time
  })

  return (
    <>
      {PUMPKINS.map((pumpkin, index) => (
        <group
          key={pumpkin.seed}
          position={pumpkin.position}
          rotation={[0, pumpkin.yaw, 0]}
          scale={pumpkin.scale}
        >
          {/* Lifted so the squashed body sits on the floor. */}
          <group position={[0, 0.82, 0]}>
            <mesh
              geometry={bodyGeometry}
              material={materials[index]}
              raycast={() => null}
            />
            <mesh geometry={stemGeometry} raycast={() => null}>
              <meshBasicMaterial color="#2c3a14" />
            </mesh>
          </group>
        </group>
      ))}
    </>
  )
}
