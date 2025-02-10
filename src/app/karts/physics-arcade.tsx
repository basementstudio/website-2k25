import { useKeyboardControls } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import {
  BallCollider,
  CuboidCollider,
  CylinderCollider,
  Physics,
  RapierRigidBody,
  RigidBody,
  RigidBodyProps,
  useBeforePhysicsStep,
  useRapier
} from "@react-three/rapier"
import { useRef } from "react"
import * as THREE from "three"

import { CarControls } from "./scene"

const up = new THREE.Vector3(0, 1, 0)
const maxForwardSpeed = 14
const maxReverseSpeed = -8

const wheels = [
  // front
  { position: new THREE.Vector3(-0.45, -0.15, -0.4) },
  { position: new THREE.Vector3(0.45, -0.15, -0.4) },
  // rear
  { position: new THREE.Vector3(-0.45, -0.15, 0.4) },
  { position: new THREE.Vector3(0.45, -0.15, 0.4) }
]

const _bodyPosition = new THREE.Vector3()
const _bodyEuler = new THREE.Euler()
const _cameraPosition = new THREE.Vector3()
const _impulse = new THREE.Vector3()

export const Car = (props: RigidBodyProps) => {
  const { rapier, world } = useRapier()

  const bodyRef = useRef<RapierRigidBody>(null!)
  const groupRef = useRef<THREE.Group>(null!)
  const wheelsRef = useRef<(THREE.Object3D | null)[]>([])

  const wheelRotation = useRef(0)

  const steeringInput = useRef(0)

  const steeringAngle = useRef(0)
  const steeringAngleQuat = useRef(new THREE.Quaternion())

  const driftSteeringAngle = useRef(0)

  const driftingLeft = useRef(false)
  const driftingRight = useRef(false)
  const driftSteeringVisualAngle = useRef(0)

  const speed = useRef(0)
  const grounded = useRef(false)
  const holdingJump = useRef(false)
  const jumpTime = useRef(0)

  const [, getKeyboardControls] = useKeyboardControls<CarControls>()

  useBeforePhysicsStep(() => {
    const controls = getKeyboardControls()
    const { forward, backward, left, right, jump, drift } = controls

    const impulse = _impulse.set(0, 0, -speed.current).multiplyScalar(5)

    // check if grounded
    const groundRayResult = world.castRay(
      new rapier.Ray(bodyRef.current.translation(), { x: 0, y: -1, z: 0 }),
      1,
      false,
      undefined,
      undefined,
      undefined,
      bodyRef.current
    )
    grounded.current = groundRayResult !== null

    // steering angle
    steeringInput.current = Number(left) - Number(right)
    // udpate angle based on direction
    if (impulse.z > 0) {
      steeringInput.current *= -1
    }

    // update vehicle angle
    steeringAngle.current += steeringInput.current * 0.02

    // drifting controls
    if (!drift) {
      driftingLeft.current = false
      driftingRight.current = false
    }

    if (
      drift &&
      grounded.current &&
      1 < speed.current &&
      jumpTime.current + 100 < Date.now()
    ) {
      if (left) {
        driftingLeft.current = true
      }

      if (right) {
        driftingRight.current = true
      }

      if (
        (driftingLeft.current && driftingRight.current) ||
        (!left && !right)
      ) {
        driftingLeft.current = false
        driftingRight.current = false
      }
    } else {
      driftingLeft.current = false
      driftingRight.current = false
    }

    // drift steering
    let driftSteeringTarget = 0

    if (driftingLeft.current) {
      driftSteeringTarget = 1
    } else if (driftingRight.current) {
      driftSteeringTarget = -1
    }

    driftSteeringAngle.current = THREE.MathUtils.lerp(
      driftSteeringAngle.current,
      driftSteeringTarget,
      0.5
    )

    steeringAngle.current += driftSteeringAngle.current * 0.01

    steeringAngleQuat.current.setFromAxisAngle(up, steeringAngle.current)

    impulse.applyQuaternion(steeringAngleQuat.current)

    // acceleration and deceleration
    let speedTarget = 0

    if (forward) {
      speedTarget = maxForwardSpeed
    } else if (backward) {
      speedTarget = maxReverseSpeed
    }

    speed.current = THREE.MathUtils.lerp(speed.current, speedTarget, 0.03)

    // jump
    if (grounded.current && jump && !holdingJump.current) {
      impulse.y = 2
      holdingJump.current = true

      jumpTime.current = Date.now()
    }

    // apply impulse
    if (impulse.length() > 0) {
      bodyRef.current.applyImpulse(impulse, true)
    }

    // damping
    bodyRef.current.applyImpulse(
      {
        x: -bodyRef.current.linvel().x * 1.5,
        y: 0,
        z: -bodyRef.current.linvel().z * 1.5
      },
      true
    )
  })

  useFrame((state, delta) => {
    // body position
    const bodyPosition = _bodyPosition.copy(bodyRef.current.translation())
    groupRef.current.position.copy(bodyPosition)
    groupRef.current.quaternion.copy(steeringAngleQuat.current)
    groupRef.current.updateMatrix()

    // drift visual angle
    driftSteeringVisualAngle.current = THREE.MathUtils.lerp(
      driftSteeringVisualAngle.current,
      driftSteeringAngle.current,
      delta * 10
    )

    // body rotation
    const bodyEuler = _bodyEuler.setFromQuaternion(
      groupRef.current.quaternion,
      "YXZ"
    )
    bodyEuler.y = bodyEuler.y + driftSteeringVisualAngle.current * 0.4
    groupRef.current.rotation.copy(bodyEuler)

    // wheel rotation
    wheelRotation.current -= (speed.current / 50) * delta * 100
    wheelsRef.current.forEach((wheel) => {
      if (!wheel) return

      wheel.rotation.order = "YXZ"
      wheel.rotation.x = wheelRotation.current
    })

    // wheel steering
    const frontWheelsSteeringAngle = steeringInput.current * 0.5
    wheelsRef.current[1]!.rotation.y = frontWheelsSteeringAngle
    wheelsRef.current[0]!.rotation.y = frontWheelsSteeringAngle

    // camera
    if (!state.controls) {
      const cameraPosition = _cameraPosition
        .set(0, 3, 10)
        .applyQuaternion(steeringAngleQuat.current)
        .add(bodyPosition)
      state.camera.position.copy(cameraPosition)
      state.camera.lookAt(bodyPosition)
    }
  })

  return (
    <>
      {/* body */}
      <RigidBody
        {...props}
        ref={bodyRef}
        colliders={false}
        mass={3}
        ccd
        name="player"
        type="dynamic"
      >
        <BallCollider args={[0.7]} mass={3} />
      </RigidBody>

      {/* vehicle */}
      <group ref={groupRef}>
        <group position-y={-0.35}>
          <mesh>
            <boxGeometry args={[0.8, 0.4, 1.2]} />
            <meshBasicMaterial color="#fff" />
          </mesh>

          {wheels.map((wheel, index) => (
            <group
              key={index}
              ref={(ref) => ((wheelsRef.current as any)[index] = ref)}
              position={wheel.position}
            >
              <group rotation-z={-Math.PI / 2}>
                <mesh>
                  <cylinderGeometry args={[0.15, 0.15, 0.25, 16]} />
                  <meshStandardMaterial color="#222" />
                </mesh>
                <mesh scale={1.01}>
                  <cylinderGeometry args={[0.15, 0.15, 0.25, 6]} />
                  <meshStandardMaterial color="#fff" wireframe />
                </mesh>
              </group>
            </group>
          ))}
        </group>
      </group>
    </>
  )
}
