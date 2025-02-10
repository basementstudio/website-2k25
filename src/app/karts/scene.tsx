import { KeyboardControls } from "@react-three/drei"
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier"

import { Car } from "./physics-arcade"

export enum CarControls {
  forward = "forward",
  backward = "backward",
  left = "left",
  right = "right",
  drift = "drift",
  jump = "jump"
}

// Define controls map
const controls = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "drift", keys: ["ShiftLeft"] }
]

export function KartsScene() {
  return (
    <KeyboardControls map={controls}>
      <Physics debug>
        {/* Ground */}
        <RigidBody type="fixed" position={[5, -1, -15]}>
          <CuboidCollider args={[5, 1, 10]} />
        </RigidBody>
        {/* Upper floor */}
        <RigidBody type="fixed" position={[7.5, 3.62, -22]}>
          <CuboidCollider args={[6, 0.1, 7.5]} />
        </RigidBody>
        {/* Center office */}
        <RigidBody type="fixed" position={[7.1, 5.35, -19.35]}>
          <CuboidCollider args={[1.3, 1.7, 3]} />
        </RigidBody>
        {/* X walls */}
        <RigidBody type="fixed" position={[1.95, 5.35, -22]}>
          <CuboidCollider args={[0.2, 1.7, 7.5]} />
        </RigidBody>
        <RigidBody type="fixed" position={[13.3, 5.35, -22]}>
          <CuboidCollider args={[0.2, 1.7, 7.5]} />
        </RigidBody>
        {/* Back wall */}
        <RigidBody type="fixed" position={[7.5, 5.35, -29.2]}>
          <CuboidCollider args={[6, 1.7, 0.2]} />
        </RigidBody>

        {/* Car */}
        <Car position={[11, 6, -22]} />

        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
      </Physics>
    </KeyboardControls>
  )
}
