// @ts-nocheck

import { extend, useFrame, useThree } from "@react-three/fiber"
import {
  BallCollider,
  CuboidCollider,
  CylinderCollider,
  RigidBody,
  useRopeJoint,
  useSphericalJoint
} from "@react-three/rapier"
import { MeshLineGeometry, MeshLineMaterial } from "meshline"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

import { useMesh } from "@/hooks/use-mesh"

extend({ MeshLineGeometry, MeshLineMaterial })

export const Lamp = () => {
  const band = useRef(), fixed = useRef(), j1 = useRef(), j2 = useRef(), j3 = useRef(), card = useRef() // prettier-ignore
  const vec = new THREE.Vector3(), dir = new THREE.Vector3() // prettier-ignore
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
  const [dragged, drag] = useState(false)
  const [shouldToggle, setShouldToggle] = useState(false)
  const [light, setLight] = useState(false)

  const { blog } = useMesh()
  const { lamp } = blog
  // Store references to the joints
  const jointRefs = useRef({
    fixed_j1: null,
    j1_j2: null,
    j2_j3: null,
    j3_card: null
  })

  // Capture joint references
  const fixed_j1 = useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 0.02]) // prettier-ignore
  const j1_j2 = useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 0.02]) // prettier-ignore
  const j2_j3 = useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 0.02]) // prettier-ignore
  const j3_card = useSphericalJoint(j3, card, [[0, 0, 0], [0, 0.02, 0]]) // prettier-ignore

  // Store joint references on mount
  useEffect(() => {
    jointRefs.current = { fixed_j1, j1_j2, j2_j3, j3_card }
  }, [fixed_j1, j1_j2, j2_j3, j3_card])

  // Function to calculate tension between two points with a rest length
  const calculateTension = (point1, point2) => {
    const distance = new THREE.Vector3().copy(point1).sub(point2).length()

    // Tension is proportional to the difference between current length and rest length
    // Positive value means stretching (tension), negative means compression
    return distance
  }

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length() * 0.079))
      ;[card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z
      })
    }
    if (fixed.current) {
      // Calculate catmul curve
      curve.points[0].copy(j3.current.translation())
      curve.points[1].copy(j2.current.translation())
      curve.points[2].copy(j1.current.translation())
      curve.points[3].copy(fixed.current.translation())
      band.current.geometry.setPoints(curve.getPoints(32))

      // Calculate and log tension for each joint
      const fixedPos = fixed.current.translation()
      const j1Pos = j1.current.translation()
      const j2Pos = j2.current.translation()
      const j3Pos = j3.current.translation()
      const cardPos = card.current.translation()

      const tension_fixed_j1 = calculateTension(fixedPos, j1Pos)
      const tension_j1_j2 = calculateTension(j1Pos, j2Pos)
      const tension_j2_j3 = calculateTension(j2Pos, j3Pos)
      const tension_j3_card = calculateTension(j3Pos, cardPos, 0.02)

      // Calculate max tension across all joints
      const maxTension = Math.max(
        tension_fixed_j1,
        tension_j1_j2,
        tension_j2_j3,
        tension_j3_card
      )

      if (!shouldToggle) {
        if (maxTension > 0.05) {
          setShouldToggle(true)
        }
      } else if (shouldToggle) {
        if (maxTension < 0.05) {
          setShouldToggle(false)
        }
      }
    }
  })

  useEffect(() => {
    if (!shouldToggle) {
      if (lamp) {
        lamp.material.uniforms.opacity.value = light ? 1 : 0
      }
      setLight(!light)
    }
  }, [shouldToggle])

  console.log(lamp)

  return (
    <>
      <group position={[10.644, 4.3254, -17.832]}>
        <RigidBody
          ref={fixed}
          angularDamping={2}
          linearDamping={2}
          type="fixed"
        />
        <RigidBody
          position={[0, -0.035, 0]}
          ref={j1}
          angularDamping={2}
          linearDamping={2}
        >
          <BallCollider args={[0.01]} />
        </RigidBody>
        <RigidBody
          position={[0, -0.07, 0]}
          ref={j2}
          angularDamping={2}
          linearDamping={2}
        >
          <BallCollider args={[0.01]} />
        </RigidBody>
        <RigidBody
          position={[0, -0.105, 0]}
          ref={j3}
          angularDamping={2}
          linearDamping={2}
        >
          <BallCollider args={[0.01]} />
        </RigidBody>
        <RigidBody
          position={[0, -0.14, 0]}
          ref={card}
          angularDamping={2}
          linearDamping={2}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CylinderCollider args={[0.015, 0.015, 0.04]} />
          <mesh
            onPointerUp={(e) => (
              e.target.releasePointerCapture(e.pointerId), drag(false)
            )}
            onPointerDown={(e) => (
              e.target.setPointerCapture(e.pointerId),
              drag(
                new THREE.Vector3()
                  .copy(e.point)
                  .sub(vec.copy(card.current.translation()))
              )
            )}
          >
            <sphereGeometry args={[0.01, 32, 32]} />
            <meshBasicMaterial color="white" side={THREE.DoubleSide} />
          </mesh>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
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
