import { RapierRigidBody } from "@react-three/rapier"
import { RefObject } from "react"
import { Mesh, Vector2, Vector3 } from "three"

import { GameAudioSFXKey } from "@/hooks/use-game-audio"

import { GameAudioSFXKey } from "@/hooks/use-game-audio"

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
  dragStartPos: RefObject<Vector3>
  initialGrabPos: RefObject<Vector3>
  hasMovedSignificantly: RefObject<boolean>
  isThrowable: RefObject<boolean>
  hoopPosition: Position
  setIsDragging: (value: boolean) => void
  setShotMetrics: (metrics: ShotMetrics) => void
}

interface HandlePointerUpParams {
  ballRef: RefObject<RapierRigidBody | null>
  dragStartPos: RefObject<Vector3>
  hasMovedSignificantly: RefObject<boolean>
  isThrowable: RefObject<boolean>
  hoopPosition: Position
  setIsDragging: (value: boolean) => void
  isGameActive: boolean
  startGame: () => void
  upStrength: number
  forwardStrength: number
  playSoundFX: (sfx: GameAudioSFXKey, volume?: number) => void
}

interface MorphTargetMesh extends Mesh {
  morphTargetInfluences?: number[]
}

// total duration: ~4/NET_ANIMATION_SPEED secs
export const NET_ANIMATION_SPEED = 0.08

export const animateNet = (
  mesh: MorphTargetMesh,
  progress: number
): boolean => {
  if (!mesh.morphTargetInfluences) return false

  if (progress <= 1) {
    mesh.morphTargetInfluences[0] = 1 - progress
    mesh.morphTargetInfluences[1] = progress
  } else if (progress <= 2) {
    mesh.morphTargetInfluences[1] = 2 - progress
    mesh.morphTargetInfluences[2] = progress - 1
  } else if (progress <= 3) {
    mesh.morphTargetInfluences[2] = 3 - progress
    mesh.morphTargetInfluences[3] = progress - 2
  } else {
    mesh.morphTargetInfluences[3] = Math.max(0, 4 - progress)
    mesh.morphTargetInfluences[4] = Math.random() * 0.2
    mesh.morphTargetInfluences[5] = Math.random() * 0.2

    if (progress >= 4) {
      mesh.morphTargetInfluences.fill(0)
      return false
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

  const inSweetSpot =
    distanceToHoop > 3.2 && distanceToHoop < 4.2 && horizontalOffset < 0.5

  const veryClose =
    distanceToHoop > 2.8 && distanceToHoop < 3.2 && horizontalOffset < 0.3

  if (veryClose) {
    return {
      x: velocity.x,
      y: velocity.y * (1 + 0.25 * offsetMultiplier),
      z: velocity.z * (1 + 0.2 * offsetMultiplier)
    }
  }

  if (inSweetSpot) {
    return {
      x: velocity.x,
      y: velocity.y * (1 + 0.15 * offsetMultiplier),
      z: velocity.z * (1 + 0.12 * offsetMultiplier)
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
  const throwStrength = Math.min(baseThrowStrength * dragDistance, 2.5)

  const distanceToHoop = new Vector3(
    hoopPosition.x - currentPos.x,
    hoopPosition.y - currentPos.y,
    hoopPosition.z - currentPos.z
  ).length()
  const heightDifference = hoopPosition.y - currentPos.y

  return {
    x: -dragDelta.x * throwStrength * 0.015 - ballHorizontalOffset,
    y:
      heightDifference *
      upStrength *
      throwStrength *
      (distanceToHoop > 2 ? 0.85 : 1),
    z:
      -distanceToHoop *
      throwStrength *
      forwardStrength *
      (distanceToHoop > 2 ? 0.9 : 1)
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
    dragStartPos.current.set(pos.x, pos.y, pos.z)
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
      dragStartPos.current.x - currentPos.x,
      dragStartPos.current.y - currentPos.y,
      dragStartPos.current.z - currentPos.z
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
  if (ballRef.current) {
    if (!isGameActive) {
      startGame()
    }

    const currentPos = ballRef.current.translation()
    const dragDelta = new Vector3(
      dragStartPos.current.x - currentPos.x,
      dragStartPos.current.y - currentPos.y,
      dragStartPos.current.z - currentPos.z
    )

    const dragDistance = dragDelta.length()
    const verticalDragDistance = dragStartPos.current.y - currentPos.y

    if (
      dragDistance > 0.1 &&
      verticalDragDistance < -0.1 &&
      hasMovedSignificantly.current
    ) {
      ballRef.current.setBodyType(0, true)
      isThrowable.current = false

      playSoundFX("BASKETBALL_THROW", 0.5)

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
