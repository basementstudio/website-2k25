import { MeshDiscardMaterial } from "@react-three/drei"
import { extend, useLoader, useThree } from "@react-three/fiber"
import { BallCollider, RigidBody, useRopeJoint } from "@react-three/rapier"
import { track } from "@vercel/analytics"
import { MeshLineGeometry, MeshLineMaterial } from "meshline"
import { animate } from "motion"
import posthog from "posthog-js"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { EXRLoader } from "three/examples/jsm/Addons.js"

import { useAssets } from "@/components/assets-provider"
import { useInspectable } from "@/components/inspectables/context"
import { ANIMATION_CONFIG } from "@/constants/inspectables"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { createGlobalShaderMaterial } from "@/shaders/material-global-shader"

extend({ MeshLineGeometry, MeshLineMaterial })

const colorWhenOn = new THREE.Color("#f2f2f2")
const colorWhenOff = new THREE.Color("#595959")
const colorWhenInspecting = new THREE.Color("#000000")

export const Lamp = memo(function LampInner() {
  const { selected } = useInspectable()
  const setCursor = useCursor()
  const band = useRef<any>(null)

  const lampHandle = useRef<any>(null)

  const j0 = useRef<any>(null)
  const j1 = useRef<any>(null)
  const j2 = useRef<any>(null)
  const j3 = useRef<any>(null)

  const jointRefs = useRef({
    j0_j1: null,
    j1_j2: null,
    j2_j3: null
  })

  const j0_j1 = useRopeJoint(j0, j1, [[0, 0, 0], [0, 0, 0], 0.02]) // prettier-ignore
  const j1_j2 = useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 0.02]) // prettier-ignore
  const j2_j3 = useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 0.02]) // prettier-ignore

  useEffect(() => {
    // @ts-ignore
    jointRefs.current = { j0_j1, j1_j2, j2_j3 }
  }, [j0_j1, j1_j2, j2_j3])

  const vec = useMemo(() => new THREE.Vector3(), [])
  const dir = useMemo(() => new THREE.Vector3(), [])

  const { sfx } = useAssets()
  const { playSoundFX } = useSiteAudio()
  const availableSounds = sfx.blog.lamp.length
  const desiredSoundFX = useRef(Math.floor(Math.random() * availableSounds))

  const { blog } = useMesh()
  const { lamp, lampTargets } = blog

  const material = useMemo(() => {
    const material = createGlobalShaderMaterial(
      new THREE.MeshStandardMaterial({
        color: colorWhenOn
      }),
      { LIGHT: true }
    )

    material.uniforms.lightDirection.value = new THREE.Vector3(0, 1, 0)

    return material
  }, [])

  const { width, height } = useThree((state) => state.size)
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3()
      ]),
    []
  )

  const [dragged, drag] = useState(false)
  const [shouldToggle, setShouldToggle] = useState(false)
  const [light, setLight] = useState(true)

  const firstTime = useRef(true)

  const {
    lamp: { extraLightmap }
  } = useAssets()

  const lightmap = useLoader(EXRLoader, extraLightmap)

  useEffect(() => {
    lightmap.flipY = true
    lightmap.generateMipmaps = false
    lightmap.minFilter = THREE.NearestFilter
    lightmap.magFilter = THREE.NearestFilter
    lightmap.colorSpace = THREE.NoColorSpace
  }, [lightmap])

  useEffect(() => {
    if (lampTargets) {
      for (const target of lampTargets) {
        // @ts-ignore
        target.material.uniforms.lampLightmap.value = lightmap
      }
    }
  }, [lightmap, lampTargets])

  const tension = (point1: THREE.Vector3, point2: THREE.Vector3) =>
    new THREE.Vector3().copy(point1).sub(point2).length()

  useEffect(() => {
    if (selected) {
      // @ts-ignore
      animate(
        band.current.material.color,
        colorWhenInspecting,
        ANIMATION_CONFIG
      )
    } else {
      // @ts-ignore
      animate(
        band.current.material.color,
        light ? colorWhenOff : colorWhenOn,
        ANIMATION_CONFIG
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  useFrameCallback((state) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length() * 0.079))

      const delta = new THREE.Vector3().copy(vec).sub(j3.current.translation())
      if (delta.length() > 0.1) {
        drag(false)
        return
      }

      ;[j1, j2, j3, j0].forEach((ref) => ref.current?.wakeUp())
      j3.current?.setNextKinematicTranslation({
        x: vec.x,
        y: vec.y,
        z: vec.z
      })
    }

    if (j0.current) {
      // Calculate catmul curve
      const j0Pos = j0.current.translation()
      const j1Pos = j1.current.translation()
      const j2Pos = j2.current.translation()
      const j3Pos = j3.current.translation()

      curve.points[0].copy(j3Pos)
      curve.points[1].copy(j2Pos)
      curve.points[2].copy(j1Pos)
      curve.points[3].copy(j0Pos)
      band.current.geometry.setPoints(curve.getPoints(8))

      const tension_j0_j1 = tension(j0Pos, j1Pos)
      const tension_j1_j2 = tension(j1Pos, j2Pos)
      const tension_j2_j3 = tension(j2Pos, j3Pos)

      const maxTension = Math.max(tension_j0_j1, tension_j1_j2, tension_j2_j3)

      if (!shouldToggle) {
        if (maxTension > 0.065 && dragged) setShouldToggle(true)
      } else if (shouldToggle) {
        if (maxTension > 0.08 && dragged) {
          drag(false)
          setCursor("default")
        } else if (maxTension < 0.045) {
          setShouldToggle(false)
          if (dragged === null) setCursor("default")
        }
      }
    }
  })

  useEffect(() => {
    if (!firstTime.current) {
      playSoundFX(
        `BLOG_LAMP_${desiredSoundFX.current}_${shouldToggle ? "PULL" : "RELEASE"}`,
        0.1
      )
    }

    if (!shouldToggle) {
      setLight(!light)

      if (!firstTime.current) {
        track("lamp_pulled")
        posthog.capture("lamp_pulled")
        desiredSoundFX.current = Math.floor(Math.random() * availableSounds)
      } else {
        firstTime.current = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldToggle])

  useEffect(() => {
    // @ts-ignore
    if (lamp) lamp.material.uniforms.opacity.value = light ? 0 : 1
    if (lampHandle) {
      // @ts-ignore
      lampHandle.current.material.uniforms.baseColor.value = light
        ? colorWhenOff
        : colorWhenOn
    }
    if (band) {
      // @ts-ignore
      band.current.material.color = light
        ? colorWhenOff.clone()
        : colorWhenOn.clone()
    }
    if (lampTargets) {
      for (const target of lampTargets) {
        if (target instanceof THREE.Mesh) {
          // @ts-ignore
          target.material.uniforms.lightLampEnabled.value = light
          // @ts-ignore
        }
      }
    }
  }, [light, lamp, lampTargets, material])

  return (
    <>
      <group position={[10.644, 4.3, -17.832]}>
        <RigidBody
          ref={j0}
          angularDamping={100}
          linearDamping={2}
          type="fixed"
        />

        <RigidBody
          ref={j1}
          position={[0, -0.02, 0]}
          angularDamping={100}
          linearDamping={2}
        >
          <BallCollider args={[0.01]} />
        </RigidBody>

        <RigidBody
          ref={j2}
          position={[0, -0.04, 0]}
          angularDamping={100}
          linearDamping={2}
        >
          <BallCollider args={[0.01]} />
        </RigidBody>

        <RigidBody
          ref={j3}
          position={[0, -0.06, 0]}
          angularDamping={100}
          linearDamping={2}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <BallCollider args={[0.01]} />
          <mesh
            onPointerUp={(e) => {
              // @ts-ignore
              e?.target?.releasePointerCapture?.(e.pointerId)
              setCursor(dragged ? "grab" : "default")
              drag(false)
            }}
            onPointerDown={(e) => {
              // @ts-ignore
              e?.target?.setPointerCapture?.(e.pointerId)
              setCursor("grabbing")

              drag(true)
            }}
            onPointerEnter={() => setCursor("grab")}
            onPointerLeave={() => setCursor("default")}
          >
            <sphereGeometry args={[0.02, 8, 8]} />
            <MeshDiscardMaterial />
          </mesh>

          <mesh material={material} ref={lampHandle}>
            <sphereGeometry args={[0.005, 8, 8]} />
          </mesh>
        </RigidBody>

        <Constraint
          position={[0.2, 0.2, 0.15]}
          rotation={[0, Math.PI / 3, -Math.PI / 18]}
          args={[0.4, 0.4]}
          onEnter={() => drag(false)}
        />

        <Constraint
          position={[0.2, 0, 0.55]}
          rotation={[0, Math.PI / 3, -Math.PI / 5]}
          args={[0.4, 1]}
          onEnter={() => drag(false)}
        />

        <Constraint
          position={[0.2, 0, -0.2]}
          rotation={[0, Math.PI / 3, 0]}
          args={[0.4, 1]}
          onEnter={() => drag(false)}
        />

        <Constraint
          position={[0.2, -0.4, 0.55]}
          rotation={[0, Math.PI / 3, 0]}
          args={[1, 0.4]}
          onEnter={() => drag(false)}
        />
      </group>

      {lamp && <primitive object={lamp} />}

      <mesh ref={band}>
        {/* @ts-ignore */}
        <meshLineGeometry />
        {/* @ts-ignore */}
        <meshLineMaterial
          color={colorWhenOn}
          resolution={[width, height]}
          lineWidth={0.005}
        />

        {lamp && <primitive object={lamp} />}
      </mesh>
    </>
  )
})

interface ConstraintProps {
  position: [number, number, number]
  rotation: [number, number, number]
  args: [number, number]
  onEnter?: () => void
}

const Constraint = ({ position, rotation, args, onEnter }: ConstraintProps) => (
  <mesh position={position} rotation={rotation} onPointerEnter={onEnter}>
    <planeGeometry args={args} />
    <MeshDiscardMaterial />
  </mesh>
)
