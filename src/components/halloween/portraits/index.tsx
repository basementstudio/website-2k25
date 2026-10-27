import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import {
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Plane,
  PlaneGeometry,
  Raycaster,
  ShaderMaterial,
  Vector3
} from "three"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import {
  lightFlickerUniform,
  lightningUniform
} from "@/shaders/material-global-shader"

import { useHalloweenPointer } from "../use-pointer"
import frag from "./frag.glsl"
import vert from "./vert.glsl"

// Front faces of two existing poster frames in the office export. Kept
// just off the print, inside its border. Local +Y is always world up.
const PORTRAITS = [
  {
    name: "people-back-wall",
    position: [7.108, 5.334, -22.45],
    width: 0.84,
    height: 1.1,
    yaw: Math.PI
  },
  {
    name: "people-poster-wall",
    position: [13.07, 5.532, -25.727],
    width: 0.84,
    height: 1.1,
    yaw: -Math.PI / 2
  }
] as const

export const HalloweenPortraits = ({
  reducedMotion = false
}: {
  reducedMotion?: boolean
}) => {
  const mesh = useRef<InstancedMesh>(null)
  const pointer = useHalloweenPointer()
  const { fadeFactor } = useFadeAnimation()
  const geometry = useMemo(() => {
    const geometry = new PlaneGeometry(1, 1)
    geometry.setAttribute(
      "aPortrait",
      new InstancedBufferAttribute(
        Float32Array.from(PORTRAITS, (_, i) => i),
        1
      )
    )
    return geometry
  }, [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        defines: { PORTRAIT_COUNT: PORTRAITS.length },
        uniforms: {
          uGaze: { value: PORTRAITS.map(() => new Vector3()) },
          fadeFactor: { value: 0 },
          uLightFlicker: lightFlickerUniform,
          uLightning: lightningUniform
        },
        transparent: true,
        depthWrite: false
      }),
    []
  )
  const surfaces = useMemo(
    () =>
      PORTRAITS.map((portrait) => {
        const center = new Vector3(...portrait.position)
        const normal = new Vector3(
          Math.sin(portrait.yaw),
          0,
          Math.cos(portrait.yaw)
        )
        const right = new Vector3(
          Math.cos(portrait.yaw),
          0,
          -Math.sin(portrait.yaw)
        )
        return {
          center,
          normal,
          right,
          plane: new Plane().setFromNormalAndCoplanarPoint(normal, center)
        }
      }),
    []
  )
  const scratch = useMemo(
    () => ({
      raycaster: new Raycaster(),
      hit: new Vector3(),
      local: new Vector3(),
      camera: new Vector3()
    }),
    []
  )

  useLayoutEffect(() => {
    if (!mesh.current) return
    const matrix = new Matrix4()
    const scale = new Matrix4()
    PORTRAITS.forEach((portrait, i) => {
      matrix
        .makeRotationY(portrait.yaw)
        .multiply(scale.makeScale(portrait.width, portrait.height, 1))
        .setPosition(
          portrait.position[0],
          portrait.position[1],
          portrait.position[2]
        )
      mesh.current!.setMatrixAt(i, matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  }, [])

  useFrameCallback((state, delta) => {
    const fade = fadeFactor.current.get()
    material.uniforms.fadeFactor.value = fade
    scratch.raycaster.setFromCamera(pointer.position, state.camera)
    state.camera.getWorldPosition(scratch.camera)
    surfaces.forEach((surface, i) => {
      const portrait = PORTRAITS[i]
      let x = 0,
        y = 0,
        near = 0
      const facing =
        scratch.local
          .subVectors(scratch.camera, surface.center)
          .dot(surface.normal) > 0
      if (
        pointer.active &&
        fade < 0.01 &&
        facing &&
        scratch.raycaster.ray.intersectPlane(surface.plane, scratch.hit)
      ) {
        scratch.local.subVectors(scratch.hit, surface.center)
        x = scratch.local.dot(surface.right) / (portrait.width * 0.5)
        y = scratch.local.y / (portrait.height * 0.5)
        near = Number(Math.abs(x) < 1.3 && Math.abs(y) < 1.3)
      }
      const gaze = material.uniforms.uGaze.value[i] as Vector3
      const targetX = reducedMotion ? 0 : MathUtils.clamp(x, -1, 1)
      const targetY = reducedMotion ? 0 : MathUtils.clamp(y, -1, 1)
      gaze.set(
        MathUtils.damp(gaze.x, targetX, 9, delta),
        MathUtils.damp(gaze.y, targetY, 9, delta),
        reducedMotion ? near : MathUtils.damp(gaze.z, near, 6, delta)
      )
    })
  })

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material]
  )

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, PORTRAITS.length]}
      frustumCulled={false}
      raycast={() => null}
      renderOrder={-1}
    />
  )
}
