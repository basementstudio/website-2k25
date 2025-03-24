import { RapierRigidBody } from "@react-three/rapier"
import { RefObject } from "react"
import { Mesh, Vector2, Vector3 } from "three"

import { SiteAudioSFXKey } from "@/hooks/use-site-audio"

interface Position {
  x: number
  y: number
  z: number
}

interface Velocity {
  x: number
  y: number
  z: number
}

interface ShotMetrics {
  angle: string
  probability: string
}

interface PointerHandlerParams {
  event: PointerEvent
  ballRef: RefObject<RapierRigidBody | null>
  mousePos: RefObject<Vector2>
  lastMousePos: RefObject<Vector2>
  dragStartPos: Vector3
  initialGrabPos: RefObject<Vector3>
  hasMovedSignificantly: RefObject<boolean>
  isThrowable: RefObject<boolean>
  hoopPosition: Position
  setIsDragging: (value: boolean) => void
  setShotMetrics: (metrics: ShotMetrics) => void
}

interface HandlePointerUpParams {
  ballRef: RefObject<RapierRigidBody | null>
  dragStartPos: Vector3
  hasMovedSignificantly: RefObject<boolean>
  isThrowable: RefObject<boolean>
  hoopPosition: Position
  setIsDragging: (value: boolean) => void
  isGameActive: boolean
  startGame: () => void
  upStrength: number
  forwardStrength: number
  playSoundFX: (sfx: SiteAudioSFXKey, volume?: number, pitch?: number) => void
  throwVelocity: Vector2
}

interface MorphTargetMesh extends Mesh {
  morphTargetInfluences?: number[]
}

export const NET_ANIMATION_SPEED = 0.008

const createMorphKeyframes = () => {
  const numKeyframes = 19
  const duration = 1.0
  const keyframes = []

  for (let i = 0; i < numKeyframes; i++) {
    keyframes.push({
      time: (duration / numKeyframes) * i,
      value: 1
    })
  }

  return keyframes
}

const morphKeyframes = createMorphKeyframes()

export const animateNet = (
  mesh: MorphTargetMesh,
  progress: number
): boolean => {
  if (!mesh.morphTargetInfluences) return false
  if (progress >= 1.0) return false

  mesh.morphTargetInfluences.fill(0)

  const waveWidth = 0.15
  const numKeyframes = morphKeyframes.length

  for (let i = 0; i < numKeyframes; i++) {
    const keyframeTime = morphKeyframes[i].time
    const distance = Math.abs(progress - keyframeTime)

    if (distance < waveWidth) {
      const influence = Math.cos((distance / waveWidth) * Math.PI * 0.5)
      mesh.morphTargetInfluences[i] = Math.max(0, influence)
    }
  }

  return true
}

export const calculateShotMetrics = (
  currentPos: Position,
  hoopPosition: Position,
  dragDelta: Vector3
): ShotMetrics => {
  const dx = hoopPosition.x - currentPos.x
  const dy = hoopPosition.y - currentPos.y
  const dz = hoopPosition.z - currentPos.z

  // calculate angle
  const angle = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * (180 / Math.PI)

  // calculate success probability
  const idealAngle = 40
  const angleDeviation = Math.abs(angle - idealAngle)
  const probability = Math.max(0, 100 - angleDeviation * 2)

  return {
    angle: angle.toFixed(1),
    probability: probability.toFixed(1)
  }
}

export const applyThrowAssistance = (
  velocity: Velocity,
  currentPos: Position,
  hoopPosition: Position
): Velocity => {
  const distanceToHoop = new Vector3(
    hoopPosition.x - currentPos.x,
    hoopPosition.y - currentPos.y,
    hoopPosition.z - currentPos.z
  ).length()

  const horizontalOffset = Math.abs(hoopPosition.x - currentPos.x)
  const offsetMultiplier = Math.max(0, 1 - horizontalOffset * 0.5)

  const perfectSpot =
    distanceToHoop > 3.1 && distanceToHoop < 4.2 && horizontalOffset < 0.5
  const goodSpot =
    distanceToHoop > 2.8 && distanceToHoop < 4.4 && horizontalOffset < 0.7
  const closeSpot =
    distanceToHoop > 2.4 && distanceToHoop < 3.2 && horizontalOffset < 0.4

  if (perfectSpot) {
    return {
      x: velocity.x * 0.95,
      y: velocity.y * (1 + 0.3 * offsetMultiplier),
      z: velocity.z * (1 + 0.2 * offsetMultiplier)
    }
  }

  if (goodSpot) {
    return {
      x: velocity.x * 0.97,
      y: velocity.y * (1 + 0.2 * offsetMultiplier),
      z: velocity.z * (1 + 0.15 * offsetMultiplier)
    }
  }

  if (closeSpot) {
    return {
      x: velocity.x * 0.98,
      y: velocity.y * (1 + 0.15 * offsetMultiplier),
      z: velocity.z * (1 + 0.1 * offsetMultiplier)
    }
  }

  return velocity
}

interface ThrowVelocityParams {
  dragDelta: Vector3
  currentPos: Position
  hoopPosition: Position
  dragDistance: number
  upStrength: number
  forwardStrength: number
  ballHorizontalOffset: number
  pointerVelocity: Vector2
}

interface SpinCalculation {
  torque: { x: number; y: number; z: number }
  velocityModifier: Velocity
}

const calculateSpinEffect = (
  dragDelta: Vector3,
  pointerVelocity: Vector2,
  throwStrength: number
): SpinCalculation => {
  // Calculate horizontal spin based on pointer movement
  const horizontalSpin = pointerVelocity.x * 0.008

  // Calculate vertical spin based on drag motion
  const verticalSpin = -dragDelta.y * 0.006

  // Calculate forward spin based on throw strength
  const forwardSpin = throwStrength * 0.004

  // Combine spins into torque
  const torque = {
    x: forwardSpin + verticalSpin,
    y: horizontalSpin,
    z: horizontalSpin * -0.5
  }

  // Calculate how spin affects velocity
  const velocityModifier = {
    x: horizontalSpin * throwStrength * 0.3,
    y: verticalSpin * throwStrength * 0.2,
    z: 0
  }

  return { torque, velocityModifier }
}

export const calculateThrowVelocity = ({
  dragDelta,
  currentPos,
  hoopPosition,
  dragDistance,
  upStrength,
  forwardStrength,
  ballHorizontalOffset,
  pointerVelocity
}: ThrowVelocityParams): {
  velocity: Velocity
  spin: { x: number; y: number; z: number }
} => {
  const baseThrowStrength = 0.82

  const pointerSpeed = Math.sqrt(
    pointerVelocity.x * pointerVelocity.x +
      pointerVelocity.y * pointerVelocity.y
  )

  const pointerSpeedInfluence = Math.min(
    Math.pow(pointerSpeed * 0.25, 1.2),
    1.3
  )

  const distanceStrength = Math.min(
    baseThrowStrength * Math.pow(dragDistance, 1.1),
    2.8
  )

  const throwStrength = distanceStrength * (1 + pointerSpeedInfluence)

  // Calculate spin effects
  const spinEffect = calculateSpinEffect(
    dragDelta,
    pointerVelocity,
    throwStrength
  )

  const distanceToHoop = new Vector3(
    hoopPosition.x - currentPos.x,
    hoopPosition.y - currentPos.y,
    hoopPosition.z - currentPos.z
  ).length()

  const heightDifference = hoopPosition.y - currentPos.y

  const horizontalDistance = Math.abs(hoopPosition.x - currentPos.x)
  const centeringForce = Math.pow(horizontalDistance, 1.2) * 0.02
  const centeringDirection = currentPos.x > hoopPosition.x ? 1 : -1
  const xCorrection =
    centeringForce * centeringDirection + ballHorizontalOffset * 0.9

  const arcMultiplier = distanceToHoop > 3 ? 1.25 : 1.4
  const heightMultiplier = distanceToHoop > 3 ? 1.2 : 1.35

  // Combine base velocity with spin effects
  return {
    velocity: {
      x:
        -dragDelta.x * throwStrength * 0.018 -
        xCorrection +
        spinEffect.velocityModifier.x,
      y:
        heightDifference *
          upStrength *
          throwStrength *
          heightMultiplier *
          (1 + Math.pow(distanceToHoop * 0.1, 1.1)) +
        spinEffect.velocityModifier.y,
      z:
        -distanceToHoop *
        throwStrength *
        forwardStrength *
        arcMultiplier *
        (1 + Math.pow(distanceToHoop * 0.08, 1.1))
    },
    spin: spinEffect.torque
  }
}

export const handlePointerDown = ({
  event,
  ballRef,
  mousePos,
  lastMousePos,
  dragStartPos,
  initialGrabPos,
  isThrowable,
  setIsDragging
}: PointerHandlerParams) => {
  if (!isThrowable.current) return

  event.stopPropagation()
  setIsDragging(true)

  if (ballRef.current) {
    const ball = ballRef.current
    const pos = ball.translation()
    dragStartPos.set(pos.x, pos.y, pos.z)
    initialGrabPos.current.set(pos.x, pos.y, pos.z)

    mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1
    mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    lastMousePos.current.copy(mousePos.current)
  }
}

export const handlePointerMove = ({
  event,
  ballRef,
  mousePos,
  dragStartPos,
  initialGrabPos,
  hasMovedSignificantly,
  hoopPosition,
  setShotMetrics
}: PointerHandlerParams) => {
  mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1
  mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1

  if (ballRef.current) {
    const ball = ballRef.current
    const currentPos = ball.translation()

    const moveDistance = new Vector3(
      initialGrabPos.current.x - currentPos.x,
      initialGrabPos.current.y - currentPos.y,
      initialGrabPos.current.z - currentPos.z
    ).length()

    // 0.2
    if (moveDistance > 0.2) {
      hasMovedSignificantly.current = true
    }

    const dragDelta = new Vector3(
      dragStartPos.x - currentPos.x,
      dragStartPos.y - currentPos.y,
      dragStartPos.z - currentPos.z
    )

    const metrics = calculateShotMetrics(currentPos, hoopPosition, dragDelta)
    setShotMetrics(metrics)
  }
}

export const handlePointerUp = ({
  ballRef,
  dragStartPos,
  hasMovedSignificantly,
  isThrowable,
  hoopPosition,
  setIsDragging,
  isGameActive,
  startGame,
  upStrength,
  forwardStrength,
  playSoundFX,
  throwVelocity
}: HandlePointerUpParams) => {
  if (ballRef.current && isThrowable.current) {
    if (!isGameActive) {
      startGame()
    }

    const ball = ballRef.current
    const currentPos = ball.translation()
    const dragDelta = new Vector3(
      dragStartPos.x - currentPos.x,
      dragStartPos.y - currentPos.y,
      dragStartPos.z - currentPos.z
    ).multiplyScalar(1.1)

    const dragDistance = dragDelta.length()
    const verticalDragDistance = dragStartPos.y - currentPos.y
    const pointerSpeed = Math.sqrt(
      throwVelocity.x * throwVelocity.x + throwVelocity.y * throwVelocity.y
    )

    if (
      dragDistance > 0.1 &&
      verticalDragDistance < -0.1 &&
      hasMovedSignificantly.current
    ) {
      ball.setBodyType(0, true)
      isThrowable.current = false

      const randomPitch = 0.95 + Math.random() * 0.1
      playSoundFX("BASKETBALL_THROW", 0.3, randomPitch)

      const ballHorizontalOffset = (currentPos.x - hoopPosition.x) * 0.04
      const { velocity: rawVelocity, spin } = calculateThrowVelocity({
        dragDelta,
        currentPos,
        hoopPosition,
        dragDistance,
        upStrength,
        forwardStrength,
        ballHorizontalOffset,
        pointerVelocity: throwVelocity
      })

      const assistedVelocity = applyThrowAssistance(
        rawVelocity,
        currentPos,
        hoopPosition
      )

      ball.applyImpulse(assistedVelocity, true)
      ball.applyTorqueImpulse(spin, true)
    } else {
      ball.setBodyType(0, true)
    }

    setIsDragging(false)
  }
}
