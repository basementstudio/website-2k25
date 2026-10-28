import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import {
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Raycaster,
  ShaderMaterial,
  Sphere,
  Vector3
} from "three"

import { useAssets } from "@/components/assets-provider"
import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { PUMPKINS } from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import {
  lightFlickerUniform,
  lightningUniform
} from "@/shaders/material-global-shader"

import { useHalloweenPointer } from "../use-pointer"
import frag from "./frag.glsl"
import { createPumpkinGeometry } from "./geometry"
import vert from "./vert.glsl"

const VARIETIES = {
  round: { width: 1, depth: 1, color: "#cd6b25" },
  squat: { width: 1.28, depth: 1.16, color: "#a94b17" },
  tall: { width: 0.72, depth: 0.78, color: "#c4b38d" }
} as const
const FACES = { whole: -1, classic: 0, angry: 1, crooked: 2 } as const

// All pumpkins, including stems and glowing faces, share one draw call.
export const HalloweenPumpkins = ({
  reducedMotion = false
}: {
  reducedMotion?: boolean
}) => {
  const mesh = useRef<InstancedMesh>(null)
  const { scenes } = useAssets()
  const { fadeFactor } = useFadeAnimation()
  const pointer = useHalloweenPointer()
  const pumpkins = useMemo(
    () =>
      PUMPKINS.map((pumpkin) => {
        const camera = pumpkin.faceCamera
          ? scenes.find(
              (scene) => scene.name.toLowerCase() === pumpkin.faceCamera
            )?.cameraConfig.position
          : undefined
        return {
          ...pumpkin,
          ...VARIETIES[pumpkin.variety],
          rotation: camera
            ? Math.atan2(
                camera[0] - pumpkin.position[0],
                camera[2] - pumpkin.position[2]
              )
            : pumpkin.rotation
        }
      }),
    [scenes]
  )
  const geometry = useMemo(() => {
    const geometry = createPumpkinGeometry()
    geometry.setAttribute(
      "aPumpkin",
      new InstancedBufferAttribute(
        Float32Array.from(PUMPKINS, (_, i) => i),
        1
      )
    )
    geometry.setAttribute(
      "aFace",
      new InstancedBufferAttribute(
        Float32Array.from(PUMPKINS, (p) => FACES[p.face]),
        1
      )
    )
    geometry.setAttribute(
      "aTint",
      new InstancedBufferAttribute(
        Float32Array.from(
          PUMPKINS.flatMap((p) =>
            new Color(VARIETIES[p.variety].color).toArray()
          )
        ),
        3
      )
    )
    return geometry
  }, [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        defines: { PUMPKIN_COUNT: PUMPKINS.length },
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 1 },
          uHover: { value: new Float32Array(PUMPKINS.length) },
          fadeFactor: { value: 0 },
          uLightFlicker: lightFlickerUniform,
          uLightning: lightningUniform
        }
      }),
    []
  )

  useLayoutEffect(() => {
    if (!mesh.current) return
    const matrix = new Matrix4()
    const scale = new Matrix4()
    pumpkins.forEach((pumpkin, i) => {
      matrix
        .makeRotationY(pumpkin.rotation)
        .multiply(
          scale.makeScale(
            pumpkin.height * pumpkin.width,
            pumpkin.height,
            pumpkin.height * pumpkin.depth
          )
        )
        .setPosition(
          pumpkin.position[0],
          pumpkin.position[1] + 0.003,
          pumpkin.position[2]
        )
      mesh.current!.setMatrixAt(i, matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  }, [pumpkins])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material]
  )

  const scratch = useMemo(
    () => ({
      raycaster: new Raycaster(),
      sphere: new Sphere(),
      hit: new Vector3(),
      matrix: new Matrix4(),
      scale: new Matrix4(),
      centers: pumpkins.map(
        (p) =>
          new Vector3(
            p.position[0],
            p.position[1] + p.height * 0.5,
            p.position[2]
          )
      )
    }),
    [pumpkins]
  )

  useFrameCallback((state, delta, time) => {
    material.uniforms.uTime.value = time
    material.uniforms.fadeFactor.value = fadeFactor.current.get()
    let selected = -1
    let nearest = Infinity
    if (pointer.active && fadeFactor.current.get() < 0.01) {
      scratch.raycaster.setFromCamera(pointer.position, state.camera)
      pumpkins.forEach((pumpkin, i) => {
        scratch.sphere.set(
          scratch.centers[i],
          pumpkin.height * Math.max(0.82, pumpkin.width * 0.72)
        )
        if (!scratch.raycaster.ray.intersectSphere(scratch.sphere, scratch.hit))
          return
        const distance = scratch.hit.distanceToSquared(
          scratch.raycaster.ray.origin
        )
        if (distance < nearest) {
          nearest = distance
          selected = i
        }
      })
    }
    const hover = material.uniforms.uHover.value as Float32Array
    pumpkins.forEach((pumpkin, i) => {
      hover[i] = reducedMotion
        ? Number(i === selected)
        : MathUtils.damp(hover[i], Number(i === selected), 7, delta)
      const awake = reducedMotion ? 0 : hover[i]
      const shake = Math.sin(time * 31 + i * 2.3) * awake
      scratch.matrix
        .makeRotationY(pumpkin.rotation + shake * 0.035)
        .multiply(
          scratch.scale.makeScale(
            pumpkin.height * pumpkin.width,
            pumpkin.height,
            pumpkin.height * pumpkin.depth
          )
        )
        .setPosition(
          pumpkin.position[0] + shake * pumpkin.height * 0.008,
          pumpkin.position[1] + 0.003,
          pumpkin.position[2]
        )
      mesh.current?.setMatrixAt(i, scratch.matrix)
    })
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, PUMPKINS.length]}
      frustumCulled={false}
      raycast={() => null}
    />
  )
}
