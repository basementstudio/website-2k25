import { useMemo, useRef } from "react"
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  MathUtils,
  ShaderMaterial,
  Vector3
} from "three"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { BATS } from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import frag from "./frag.glsl"
import vert from "./vert.glsl"

// Half of a bat's silhouette, flat on XZ (nose toward +z, wing out along
// +x), as a fan from the shoulder: a wing with scalloped trailing edge.
const WING: [number, number][] = [
  [0.06, 0.05],
  [0.3, 0.2],
  [0.65, 0.22],
  [1, 0.02],
  [0.82, -0.05],
  [0.72, -0.22],
  [0.5, -0.06],
  [0.36, -0.26],
  [0.16, -0.12],
  [0.05, -0.2]
]
// Head with ears and a short body, drawn on the centre line.
const BODY: [number, number][] = [
  [0, 0.42],
  [0.05, 0.3],
  [0.1, 0.4],
  [0.11, 0.24],
  [0.09, 0],
  [0.05, -0.3],
  [0, -0.4],
  [-0.05, -0.3],
  [-0.09, 0],
  [-0.11, 0.24],
  [-0.1, 0.4],
  [-0.05, 0.3]
]

const createBatGeometry = () => {
  const positions: number[] = []
  const tri = (...points: [number, number][]) =>
    points.forEach(([x, z]) => positions.push(x, 0, z))

  for (const side of [1, -1]) {
    // Wings are subdivided so the flap bends smoothly instead of hinging.
    for (let i = 1; i < WING.length - 1; i++) {
      tri(
        [WING[0][0] * side, WING[0][1]],
        [WING[i][0] * side, WING[i][1]],
        [WING[i + 1][0] * side, WING[i + 1][1]]
      )
    }
  }
  for (let i = 1; i < BODY.length - 1; i++) tri(BODY[0], BODY[i], BODY[i + 1])

  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))
  return geometry
}

const position = new Vector3()
const next = new Vector3()

interface BatProps {
  bat: (typeof BATS)[number]
}

const Bat = ({ bat }: BatProps) => {
  const ref = useRef<Group>(null)
  const { fadeFactor } = useFadeAnimation()
  const geometry = useMemo(createBatGeometry, [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: bat.seed },
          uFlap: { value: bat.flap },
          uColor: { value: new Color("#1a0710") },
          uOpacity: { value: 1 }
        },
        transparent: true,
        side: DoubleSide
      }),
    [bat.seed, bat.flap]
  )

  const path = (t: number, out: Vector3) => {
    const a = t * bat.speed + bat.seed * 10
    // Wide loop with a second, faster wobble so it swoops instead of orbiting.
    return out.set(
      bat.center[0] + Math.sin(a) * bat.radius[0],
      bat.center[1] + Math.sin(a * 1.7 + 2) * bat.radius[1],
      bat.center[2] + Math.sin(a * 2 + 1) * bat.radius[2]
    )
  }

  useFrameCallback(({ camera }, __, time) => {
    const group = ref.current
    if (!group) return

    path(time, position)
    path(time + 0.1, next)
    group.position.copy(position)
    // Face the direction of travel, banking into turns and pitching with climbs.
    const dx = next.x - position.x
    const dz = next.z - position.z
    const heading = Math.atan2(dx, dz)
    const turn = MathUtils.euclideanModulo(
      heading - group.rotation.y + Math.PI,
      Math.PI * 2
    )
    const delta = turn - Math.PI
    group.rotation.order = "YXZ"
    group.rotation.y += delta * 0.15
    group.rotation.z = MathUtils.lerp(group.rotation.z, -delta * 6, 0.1)
    group.rotation.x = (next.y - position.y) * -2

    // Bats cross every camera's view; vanish before filling the screen.
    const presence = MathUtils.smoothstep(
      position.distanceTo(camera.position),
      bat.scale * 2,
      bat.scale * 5
    )
    material.uniforms.uTime.value = time
    material.uniforms.uOpacity.value =
      presence * (1 - fadeFactor.current.get() * 0.8)
  })

  return (
    <group ref={ref} scale={bat.scale}>
      <mesh
        geometry={geometry}
        material={material}
        raycast={() => null}
        // The flap moves vertices outside the flat geometry's bounds.
        frustumCulled={false}
      />
    </group>
  )
}

export const HalloweenBats = () => (
  <>
    {BATS.map((bat) => (
      <Bat key={bat.seed} bat={bat} />
    ))}
  </>
)
