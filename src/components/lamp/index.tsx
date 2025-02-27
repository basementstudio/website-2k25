import { extend, useFrame, useLoader, useThree } from "@react-three/fiber"
import { BallCollider, RigidBody, useRopeJoint } from "@react-three/rapier"
import { MeshLineGeometry, MeshLineMaterial } from "meshline"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { EXRLoader } from "three/examples/jsm/Addons.js"

import { useAssets } from "@/components/assets-provider"
import { useMesh } from "@/hooks/use-mesh"
import { useSiteAudio } from "@/hooks/use-site-audio"

extend({ MeshLineGeometry, MeshLineMaterial })

export const Lamp = () => {
  const band = useRef<any>(null)

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

  const { width, height } = useThree((state) => state.size)
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3()
      ])
  )
  const [dragged, drag] = useState<any>(null)
  const [shouldToggle, setShouldToggle] = useState(false)
  const [light, setLight] = useState(true)

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

  useFrame((state) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length() * 0.079))
      ;[j1, j2, j3, j0].forEach((ref) => ref.current?.wakeUp())
      j3.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z
      })
    }

    if (j0.current) {
      // Calculate catmul curve
      curve.points[0].copy(j3.current.translation())
      curve.points[1].copy(j2.current.translation())
      curve.points[2].copy(j1.current.translation())
      curve.points[3].copy(j0.current.translation())
      band.current.geometry.setPoints(curve.getPoints(32))

      // Calculate and log tension for each joint
      const j0Pos = j0.current.translation()
      const j1Pos = j1.current.translation()
      const j2Pos = j2.current.translation()
      const j3Pos = j3.current.translation()

      const tension_j0_j1 = tension(j0Pos, j1Pos)
      const tension_j1_j2 = tension(j1Pos, j2Pos)
      const tension_j2_j3 = tension(j2Pos, j3Pos)

      const maxTension = Math.max(tension_j0_j1, tension_j1_j2, tension_j2_j3)

      if (!shouldToggle) {
        if (maxTension > 0.05 && dragged !== null) setShouldToggle(true)
      } else if (shouldToggle) {
        if (maxTension > 0.07 && dragged !== null) drag(null)
        else if (maxTension < 0.045) {
          console.log("false")
          setShouldToggle(false)
        }
      }
    }
  })

  useEffect(() => {
    playSoundFX(
      `BLOG_LAMP_${desiredSoundFX.current}_${shouldToggle ? "PULL" : "RELEASE"}`,
      0.4
    )

    if (!shouldToggle) {
      setLight(!light)
      desiredSoundFX.current = Math.floor(Math.random() * availableSounds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldToggle])

  useEffect(() => {
    // @ts-ignore
    if (lamp) lamp.material.uniforms.opacity.value = light ? 0 : 1
    if (lampTargets) {
      for (const target of lampTargets) {
        if (target instanceof THREE.Mesh) {
          // @ts-ignore
          target.material.uniforms.lightLampEnabled.value = light
        }
      }
    }
  }, [light, lamp, lampTargets])

  return (
    <>
      <group position={[10.644, 4.3254, -17.832]}>
        <RigidBody ref={j0} angularDamping={2} linearDamping={2} type="fixed" />

        <RigidBody
          ref={j1}
          position={[0, -0.02, 0]}
          angularDamping={2}
          linearDamping={2}
        >
          <BallCollider args={[0.01]} />
        </RigidBody>

        <RigidBody
          ref={j2}
          position={[0, -0.04, 0]}
          angularDamping={2}
          linearDamping={2}
        >
          <BallCollider args={[0.01]} />
        </RigidBody>

        <RigidBody
          ref={j3}
          position={[0, -0.06, 0]}
          angularDamping={2}
          linearDamping={2}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <BallCollider args={[0.01]} />
          <mesh
            onPointerUp={(e) => {
              // @ts-ignore
              e?.target?.releasePointerCapture?.(e.pointerId)
              drag(null)
            }}
            onPointerDown={(e) => {
              // @ts-ignore
              e?.target?.setPointerCapture?.(e.pointerId)

              const vec = new THREE.Vector3()
              vec.copy(e.point)
              vec.sub(vec.copy(j3.current.translation()))

              drag(vec)
            }}
          >
            <sphereGeometry args={[0.02, 32, 32]} />
            <meshPhongMaterial
              color="white"
              transparent
              opacity={0}
              side={THREE.DoubleSide}
            />
          </mesh>
        </RigidBody>
      </group>

      <mesh ref={band}>
        {/* @ts-ignore */}
        <meshLineGeometry />
        {/* @ts-ignore */}
        <meshLineMaterial
          color="white"
          resolution={[width, height]}
          lineWidth={0.01}
        />

        {lamp && <primitive object={lamp} />}
      </mesh>
    </>
  )
}
