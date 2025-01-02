import { useFrame, useThree } from "@react-three/fiber"
import { CuboidCollider, RapierRigidBody, RigidBody } from "@react-three/rapier"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { MathUtils, Vector2, Vector3 } from "three"

import { useMinigameStore } from "@/store/minigame-store"
import { easeInOutCubic } from "@/utils/animations"

import { Basketball } from "./basketball"
import { GameUI } from "./game-ui"
import { Trajectory } from "./trajectory"

export const HoopMinigame = () => {
  const isBasketball = usePathname() === "/basketball"

  const ballRef = useRef<RapierRigidBody>(null)
  const mousePos = useRef(new Vector2())
  const lastMousePos = useRef(new Vector2())
  const throwVelocity = useRef(new Vector2())
  const dragPos = useRef(new Vector3())
  const dragStartPos = useRef(new Vector3())
  const { camera } = useThree()
  const bounceCount = useRef(0)
  const resetProgress = useRef(0)
  const startResetPos = useRef(new Vector3())
  const timerInterval = useRef<NodeJS.Timeout | null>(null)
  const hasMovedSignificantly = useRef(false)
  const initialGrabPos = useRef(new Vector3())
  const isThrowable = useRef(true)
  const isUnmounting = useRef(false)

  const {
    gameDuration,
    initialPosition,
    hoopPosition,
    forwardStrength,
    upStrength,
    score,
    setScore,
    timeRemaining,
    setTimeRemaining,
    isGameActive,
    setIsGameActive,
    isResetting,
    setIsResetting,
    isDragging,
    setIsDragging,
    shotMetrics,
    setShotMetrics
  } = useMinigameStore()

  useEffect(() => {
    const cleanupGame = () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
        timerInterval.current = null
      }

      setIsResetting(false)
      setIsDragging(false)
      setIsGameActive(false)
      setScore(0)
      setTimeRemaining(gameDuration)
      setShotMetrics({ angle: "0.0", probability: "0.0" })

      resetProgress.current = 0
      bounceCount.current = 0
      isThrowable.current = true
      startResetPos.current.set(0, 0, 0)
      dragPos.current.set(0, 0, 0)
      dragStartPos.current.set(0, 0, 0)
      mousePos.current.set(0, 0)
      lastMousePos.current.set(0, 0)
      throwVelocity.current.set(0, 0)
      initialGrabPos.current.set(0, 0, 0)

      if (ballRef.current) {
        try {
          ballRef.current.setTranslation(initialPosition, true)
          ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
          ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
        } catch (error) {
          console.warn("Failed to reset ball physics during cleanup")
        }
      }
    }

    if (isBasketball) {
      cleanupGame()
      startResetPos.current.copy(
        new Vector3(initialPosition.x, initialPosition.y, initialPosition.z)
      )
    }

    return () => {
      isUnmounting.current = true
      cleanupGame()
    }
  }, [
    isBasketball,
    gameDuration,
    initialPosition,
    setIsResetting,
    setIsDragging,
    setIsGameActive,
    setScore,
    setTimeRemaining,
    setShotMetrics
  ])

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDragging) {
        handlePointerUp()
      }
    }

    if (isBasketball) {
      window.addEventListener("pointerup", handleGlobalPointerUp)
      return () => {
        window.removeEventListener("pointerup", handleGlobalPointerUp)
      }
    }
  }, [isDragging, isBasketball])

  const startGame = () => {
    if (!isGameActive && !isUnmounting.current) {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }

      setIsGameActive(true)
      setTimeRemaining(gameDuration)

      timerInterval.current = setInterval(() => {
        if (isUnmounting.current) {
          if (timerInterval.current) {
            clearInterval(timerInterval.current)
          }
          return
        }

        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerInterval.current) {
              clearInterval(timerInterval.current)
            }
            setIsGameActive(false)
            resetGame()
            return gameDuration
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  const resetGame = () => {
    setScore(0)
    setTimeRemaining(gameDuration)
    resetBallToInitialPosition()
  }

  const resetBallToInitialPosition = (position?: {
    x: number
    y: number
    z: number
  }) => {
    if (!isBasketball || !ballRef.current) return
    try {
      if (position) {
        startResetPos.current.copy(
          new Vector3(position.x, position.y, position.z)
        )
      } else {
        startResetPos.current.copy(
          new Vector3(initialPosition.x, initialPosition.y, initialPosition.z)
        )
      }

      setIsResetting(true)
      resetProgress.current = 0
      bounceCount.current = 0
      isThrowable.current = true
    } catch (error) {
      console.warn("Failed to reset ball position")
      setIsResetting(false)
      resetProgress.current = 0
    }
  }

  useFrame(({ pointer, clock }, delta) => {
    if (!isBasketball) return

    if (isDragging && ballRef.current) {
      try {
        throwVelocity.current.x = mousePos.current.x - lastMousePos.current.x
        throwVelocity.current.y = mousePos.current.y - lastMousePos.current.y
        lastMousePos.current.copy(mousePos.current)

        const distance = 4
        dragPos.current.set(pointer.x, pointer.y, 0.5)
        dragPos.current.unproject(camera)
        dragPos.current.sub(camera.position).normalize()
        dragPos.current.multiplyScalar(distance)
        dragPos.current.add(camera.position)

        dragPos.current.x = Math.max(4.8, Math.min(5.6, dragPos.current.x))
        dragPos.current.y = Math.max(1, Math.min(3, dragPos.current.y))
        dragPos.current.z = Math.max(-11.2, Math.min(-10.2, dragPos.current.z))

        if (
          !isNaN(dragPos.current.x) &&
          !isNaN(dragPos.current.y) &&
          !isNaN(dragPos.current.z)
        ) {
          ballRef.current.setTranslation(dragPos.current, true)
        } else {
          setIsDragging(false)
          resetBallToInitialPosition()
        }
      } catch (error) {
        console.warn("Failed to update ball position, physics might be paused")
        setIsDragging(false)
      }
    }

    // score decay
    if (score > 0) {
      setScore((prev) => Math.max(0, prev - 10 * delta))
    }

    // reset ball anim
    if (isResetting && ballRef.current) {
      try {
        resetProgress.current += delta * 3
        const progress = MathUtils.clamp(resetProgress.current, 0, 1)
        const easedProgress = easeInOutCubic(progress)

        const newPosition = new Vector3().lerpVectors(
          startResetPos.current,
          new Vector3(initialPosition.x, initialPosition.y, initialPosition.z),
          easedProgress
        )

        if (
          !isNaN(newPosition.x) &&
          !isNaN(newPosition.y) &&
          !isNaN(newPosition.z)
        ) {
          ballRef.current.setTranslation(newPosition, true)
        } else {
          console.warn("invalid position during ball reset")
          setIsResetting(false)
          resetProgress.current = 0
          ballRef.current.setTranslation(initialPosition, true)
        }

        if (progress === 1) {
          setIsResetting(false)
          resetProgress.current = 0
          ballRef.current.setBodyType(2, true)
        }
      } catch (error) {
        console.warn("Failed to reset ball animation, physics might be paused")
        setIsResetting(false)
        resetProgress.current = 0
      }
    }
  })

  const handlePointerDown = (event: any) => {
    if (!isThrowable.current) return

    event.stopPropagation()
    setIsDragging(true)
    hasMovedSignificantly.current = false

    if (ballRef.current) {
      const pos = ballRef.current.translation()
      dragStartPos.current.set(pos.x, pos.y, pos.z)
      initialGrabPos.current.set(pos.x, pos.y, pos.z)

      mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1
      lastMousePos.current.copy(mousePos.current)
    }
  }

  const handlePointerMove = (event: any) => {
    mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1
    mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1

    if (isDragging && ballRef.current) {
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

      const metrics = calculateShotMetrics(currentPos, dragDelta)
      setShotMetrics(metrics)
    }
  }

  const applyThrowAssistance = (
    velocity: { x: number; y: number; z: number },
    currentPos: { x: number; y: number; z: number }
  ) => {
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

  const handlePointerUp = () => {
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

        const baseThrowStrength = 0.85
        const throwStrength = Math.min(baseThrowStrength * dragDistance, 2.5)

        const distanceToHoop = new Vector3(
          hoopPosition.x - currentPos.x,
          hoopPosition.y - currentPos.y,
          hoopPosition.z - currentPos.z
        ).length()
        const heightDifference = hoopPosition.y - currentPos.y
        const ballHorizontalOffset = (currentPos.x - hoopPosition.x) * 0.04

        const rawVelocity = {
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

        const assistedVelocity = applyThrowAssistance(rawVelocity, currentPos)
        ballRef.current.applyImpulse(assistedVelocity, true)
        ballRef.current.applyTorqueImpulse({ x: 0.015, y: 0, z: 0 }, true)
      } else {
        ballRef.current.setBodyType(0, true)
      }

      setIsDragging(false)
    }
  }

  const calculateShotMetrics = (
    currentPos: { x: number; y: number; z: number },
    dragDelta: Vector3
  ) => {
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

  if (!isBasketball) return null

  return (
    <>
      <Basketball
        ballRef={ballRef}
        initialPosition={initialPosition}
        isDragging={isDragging}
        hoopPosition={hoopPosition}
        resetBallToInitialPosition={resetBallToInitialPosition}
        handlePointerDown={handlePointerDown}
        handlePointerMove={handlePointerMove}
        handlePointerUp={handlePointerUp}
      />

      <Trajectory
        ballRef={ballRef}
        isDragging={isDragging}
        isResetting={isResetting}
      />

      {/* invisible wall */}
      <RigidBody
        type="fixed"
        name="wall"
        position={[hoopPosition.x, hoopPosition.y, hoopPosition.z - 0.1]}
      >
        <CuboidCollider args={[2.5, 3.5, 0.1]} />
      </RigidBody>

      {/* invisible floor */}
      <RigidBody
        type="fixed"
        name="floor"
        position={[hoopPosition.x, -0.08, hoopPosition.z + 3]}
      >
        <CuboidCollider args={[3.5, 0.1, 3.5]} />
      </RigidBody>

      {/* arcade collider */}
      <RigidBody type="fixed" name="floor" position={[2.943, 1.1, -14.257]}>
        <CuboidCollider args={[0.52, 1, 0.52]} />
      </RigidBody>

      {/* score detection */}
      <RigidBody
        type="fixed"
        position={[
          hoopPosition.x - 0.04,
          hoopPosition.y - 0.35,
          hoopPosition.z + 0.35
        ]}
        sensor
      >
        <CuboidCollider
          args={[0.05, 0.05, 0.05]}
          onIntersectionEnter={() => {
            setScore((prev) => prev + 1000)
          }}
        />
      </RigidBody>

      <GameUI
        hoopPosition={hoopPosition}
        timeRemaining={timeRemaining}
        score={score}
        shotMetrics={shotMetrics}
      />
    </>
  )
}
