import { RapierRigidBody, useAfterPhysicsStep } from "@react-three/rapier"
import { RefObject, useRef } from "react"

// Pokémon-GO-style curveball: spin the ball in circles while holding it,
// then release — the shot curves sideways (Magnus force perpendicular to
// the flight path) and, as it descends, bends back toward the rim. More
// spin = more curve and more magic.

// gesture
const SPIN_MIN_TURNS = 1.25
const SPIN_MAX_TURNS = 3
const SAMPLE_MIN_PX = 3

// flight
const MAGNUS_ACCEL = 1.4 // m/s² per spin turn, ⊥ to horizontal velocity
const HOMING_ACCEL = 3.0 // m/s² toward the rim axis while descending
const HOMING_RANGE = 1.4 // only bend shots already missing by less than this
const CURVE_SECONDS = 1.8
const SPIN_TORQUE = 0.004 // visible sidespin on the ball mesh
const STEP_DT = 1 / 60

// rim axis from the net GLB (see net-physics.tsx binding derivation)
const RIM_AXIS_X = 5.197
const RIM_AXIS_Z = -14.069
const RIM_Y = 3.232

// --- spin gesture tracking (fed by hoop-minigame's pointer handlers) ---

let lastX = 0
let lastY = 0
let vecX = 0
let vecY = 0
let hasVec = false
let hasPoint = false
let accumulated = 0

export const resetSpinTracking = () => {
  hasPoint = false
  hasVec = false
  accumulated = 0
}

export const trackSpin = (clientX: number, clientY: number) => {
  if (!hasPoint) {
    lastX = clientX
    lastY = clientY
    hasPoint = true
    return
  }
  const dx = clientX - lastX
  const dy = clientY - lastY
  if (Math.hypot(dx, dy) < SAMPLE_MIN_PX) return
  lastX = clientX
  lastY = clientY

  if (hasVec) {
    const cross = vecX * dy - vecY * dx
    const dot = vecX * dx + vecY * dy
    accumulated += Math.atan2(cross, dot)
  }
  vecX = dx
  vecY = dy
  hasVec = true
}

// signed spin turns for the shot being released; consumed by CurveballForce
export const spinCharge = { current: 0 }

export const armCurveball = () => {
  const turns = accumulated / (Math.PI * 2)
  resetSpinTracking()
  spinCharge.current =
    Math.abs(turns) < SPIN_MIN_TURNS
      ? 0
      : Math.sign(turns) * Math.min(Math.abs(turns), SPIN_MAX_TURNS)
  return spinCharge.current
}

// --- in-flight curve forces ---

interface CurveballForceProps {
  ballRef: RefObject<RapierRigidBody | null>
}

export const CurveballForce = ({ ballRef }: CurveballForceProps) => {
  const age = useRef(0)
  const spun = useRef(false)

  useAfterPhysicsStep(() => {
    if (spinCharge.current === 0) {
      age.current = 0
      spun.current = false
      return
    }
    const ball = ballRef.current
    if (!ball || !ball.isValid() || ball.bodyType() !== 0) {
      spinCharge.current = 0
      age.current = 0
      spun.current = false
      return
    }

    age.current += STEP_DT
    if (age.current > CURVE_SECONDS) {
      spinCharge.current = 0
      age.current = 0
      spun.current = false
      return
    }

    const spin = spinCharge.current
    const m = ball.mass()

    if (!spun.current) {
      spun.current = true
      ball.applyTorqueImpulse(
        { x: 0, y: SPIN_TORQUE * Math.sign(spin), z: 0 },
        true
      )
    }

    const v = ball.linvel()
    const horizontalSpeed = Math.hypot(v.x, v.z)

    // Magnus: push ⊥ to the horizontal flight direction
    if (horizontalSpeed > 0.3) {
      const px = -v.z / horizontalSpeed
      const pz = v.x / horizontalSpeed
      const f = m * MAGNUS_ACCEL * spin * STEP_DT
      ball.applyImpulse({ x: px * f, y: 0, z: pz * f }, true)
    }

    // the magic: on the way down, bend near-misses back into the rim
    const p = ball.translation()
    if (v.y < 0 && p.y > RIM_Y - 0.1) {
      const dx = RIM_AXIS_X - p.x
      const dz = RIM_AXIS_Z - p.z
      const miss = Math.hypot(dx, dz)
      if (miss > 0.02 && miss < HOMING_RANGE) {
        const strength =
          (Math.min(Math.abs(spin), SPIN_MAX_TURNS) / SPIN_MAX_TURNS) *
          HOMING_ACCEL
        const g = (m * strength * STEP_DT) / miss
        ball.applyImpulse({ x: dx * g, y: 0, z: dz * g }, true)
      }
    }
  })

  return null
}
