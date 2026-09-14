import { useEffect, useMemo } from "react"
import {
  cos,
  dot,
  float,
  fract,
  mod,
  sin,
  smoothstep,
  step,
  uniform,
  vec3,
  vec4
} from "three/tsl"

import { BASE_CONFIG, SPAWN_POINTS } from "@/constants/sparkles"
import { useDeviceDetect } from "@/hooks/use-device-detect"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { createBillboards } from "@/lib/graphics/billboards"
import { useGraphicsQuality } from "@/lib/graphics/quality"

import { useFadeAnimation } from "../inspectables/use-fade-animation"

function Sparkle({
  count,
  scale
}: {
  count: number
  scale: [number, number, number]
}) {
  const time = useMemo(() => uniform(0), [])
  const fade = useMemo(() => uniform(0), [])
  const { fadeFactor } = useFadeAnimation()
  const { mesh, material } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < positions.length; i++)
      positions[i] = (Math.random() - 0.5) * scale[i % 3]
    const result = createBillboards(positions, BASE_CONFIG.size * 2)
    const p = result.centers
    const phase = time.mul(BASE_CONFIG.speed)
    result.material.positionNode = p.add(
      vec3(
        sin(phase.add(p.x.mul(100))),
        cos(phase.add(p.y.mul(100))),
        cos(phase.add(p.z.mul(100)))
      ).mul(0.2)
    )
    const seed = fract(
      sin(dot(p, vec3(12.9898, 78.233, 45.164))).mul(43758.5453)
    ).mul(100)
    const cycle = mod(phase.add(seed), 10)
    const pulse = step(cycle, 1)
      .mul(smoothstep(0, 0.3, cycle))
      .mul(smoothstep(1, 0.7, cycle))
      .mul(0.5)
    result.material.fragmentNode = vec4(
      vec3(0.5),
      pulse.mul(float(1).sub(fade))
    )
    return result
  }, [count, scale, time, fade])
  useFrameCallback((_, __, elapsed) => {
    time.value = elapsed
    fade.value = fadeFactor.current.get()
  })
  useEffect(
    () => () => {
      mesh.geometry.dispose()
      material.dispose()
    },
    [mesh, material]
  )
  return <primitive object={mesh} />
}
export function Sparkles() {
  const { isMobile } = useDeviceDetect()
  const effects = useGraphicsQuality((s) => s.effects)
  if (isMobile || !effects) return null
  return (
    <>
      {SPAWN_POINTS.map((point, i) => (
        <group key={i} position={point.position}>
          <Sparkle count={point.count} scale={point.scale} />
        </group>
      ))}
    </>
  )
}
