import { RapierRigidBody } from "@react-three/rapier"
import { RefObject } from "react"
import { Mesh, Vector2, Vector3 } from "three"

import { SiteAudioSFXKey } from "@/hooks/audio/use-site-audio"

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
  const offsetMultiplier = Math.max(0, 1 - horizontalOffset * 0.45)

  const inSweetSpot =
    distanceToHoop > 3.0 && distanceToHoop < 4.4 && horizontalOffset < 0.6

  const veryClose =
    distanceToHoop > 2.6 && distanceToHoop < 3.4 && horizontalOffset < 0.4

  if (veryClose) {
    return {
      x: velocity.x,
      y: velocity.y * (1 + 0.45 * offsetMultiplier),
      z: velocity.z * (1 + 0.35 * offsetMultiplier)
    }
  }

  if (inSweetSpot) {
    return {
      x: velocity.x,
      y: velocity.y * (1 + 0.35 * offsetMultiplier),
      z: velocity.z * (1 + 0.25 * offsetMultiplier)
    }
  }

  return velocity
}

export const calculateThrowVelocity = (
  dragDelta: Vector3,
  currentPos: Position,
  hoopPosition: Position,
  dragDistance: number,
  upStrength: number,
  forwardStrength: number,
  ballHorizontalOffset: number
): Velocity => {
  const baseThrowStrength = 0.85
  const throwStrength = Math.min(baseThrowStrength * dragDistance, 3.0)

  const distanceToHoop = new Vector3(
    hoopPosition.x - currentPos.x,
    hoopPosition.y - currentPos.y,
    hoopPosition.z - currentPos.z
  ).length()
  const heightDifference = hoopPosition.y - currentPos.y

  // sideshot correction
  const horizontalDistance = Math.abs(hoopPosition.x - currentPos.x)
  const centeringForce = horizontalDistance * 0.05 // strong-ish centering force
  const centeringDirection = currentPos.x > hoopPosition.x ? 1 : -1
  const xCorrection = centeringForce * centeringDirection + ballHorizontalOffset

  return {
    x: -dragDelta.x * throwStrength * 0.02 - xCorrection,
    y:
      heightDifference *
      upStrength *
      throwStrength *
      (distanceToHoop > 2 ? 1.3 : 1.5),
    z:
      -distanceToHoop *
      throwStrength *
      forwardStrength *
      (distanceToHoop > 2 ? 1.3 : 1.5)
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
    const pos = ballRef.current.translation()
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
    const currentPos = ballRef.current.translation()

    const moveDistance = new Vector3(
      initialGrabPos.current.x - currentPos.x,
      initialGrabPos.current.y - currentPos.y,
      initialGrabPos.current.z - currentPos.z
    ).length()

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
  playSoundFX
}: HandlePointerUpParams) => {
  // this prevents the ball from being clicked when it is not throwable
  if (ballRef.current && isThrowable.current) {
    if (!isGameActive) {
      startGame()
    }

    const currentPos = ballRef.current.translation()
    const dragDelta = new Vector3(
      dragStartPos.x - currentPos.x,
      dragStartPos.y - currentPos.y,
      dragStartPos.z - currentPos.z
    ).multiplyScalar(1.1)

    const dragDistance = dragDelta.length()
    const verticalDragDistance = dragStartPos.y - currentPos.y

    if (
      dragDistance > 0.1 &&
      verticalDragDistance < -0.1 &&
      hasMovedSignificantly.current
    ) {
      ballRef.current.setBodyType(0, true)
      // isthrowable set to false only if it has moved significantly
      isThrowable.current = false

      const randomPitch = 0.95 + Math.random() * 0.1
      playSoundFX("BASKETBALL_THROW", 0.3, randomPitch)

      const ballHorizontalOffset = (currentPos.x - hoopPosition.x) * 0.04
      const rawVelocity = calculateThrowVelocity(
        dragDelta,
        currentPos,
        hoopPosition,
        dragDistance,
        upStrength,
        forwardStrength,
        ballHorizontalOffset
      )

      const assistedVelocity = applyThrowAssistance(
        rawVelocity,
        currentPos,
        hoopPosition
      )
      ballRef.current.applyImpulse(assistedVelocity, true)
      ballRef.current.applyTorqueImpulse({ x: 0.015, y: 0, z: 0 }, true)
    } else {
      ballRef.current.setBodyType(0, true)
    }

    setIsDragging(false)
  }
}
