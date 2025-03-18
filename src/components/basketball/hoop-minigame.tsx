import { useThree } from "@react-three/fiber"
import { type RapierRigidBody, RigidBody } from "@react-three/rapier"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import type * as THREE from "three"
import { MathUtils, Vector2, Vector3 } from "three"

import {
  handlePointerDown as utilsHandlePointerDown,
  handlePointerMove as utilsHandlePointerMove,
  handlePointerUp as utilsHandlePointerUp
} from "@/components/basketball/basketball-utils"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useIsOnTab } from "@/hooks/use-is-on-tab"
import { useMesh } from "@/hooks/use-mesh"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { useMinigameStore } from "@/store/minigame-store"
import { easeInOutCubic } from "@/utils/animations"

import { normalizeDelta } from "../arcade-game/lib/math"
import { Basketball } from "./basketball"
import RigidBodies from "./rigid-bodies"

const HoopMinigameInner = () => {
  const { playSoundFX } = useSiteAudio()
  const [isBasketball, setIsBasketball] = useState(false)
  const scene = useCurrentScene()
  const isOnTab = useIsOnTab()
  const gameDuration = useMinigameStore((s) => s.gameDuration)
  const initialPosition = useMinigameStore((s) => s.initialPosition)
  const hoopPosition = useMinigameStore((s) => s.hoopPosition)
  const forwardStrength = useMinigameStore((s) => s.forwardStrength)
  const upStrength = useMinigameStore((s) => s.upStrength)
  const setScore = useMinigameStore((s) => s.setScore)
  const setTimeRemaining = useMinigameStore((s) => s.setTimeRemaining)
  const isGameActive = useMinigameStore((s) => s.isGameActive)
  const setIsGameActive = useMinigameStore((s) => s.setIsGameActive)
  const isResetting = useMinigameStore((s) => s.isResetting)
  const setIsResetting = useMinigameStore((s) => s.setIsResetting)
  const isDragging = useMinigameStore((s) => s.isDragging)
  const setIsDragging = useMinigameStore((s) => s.setIsDragging)
  const setShotMetrics = useMinigameStore((s) => s.setShotMetrics)
  const resetConsecutiveScores = useMinigameStore(
    (s) => s.resetConsecutiveScores
  )
  const justScored = useMinigameStore((s) => s.justScored)
  const setJustScored = useMinigameStore((s) => s.setJustScored)
  const hasPlayed = useMinigameStore((s) => s.hasPlayed)
  const clearPlayedBalls = useMinigameStore((s) => s.clearPlayedBalls)
  const removePlayedBall = useMinigameStore((s) => s.removePlayedBall)
  const addPlayedBall = useMinigameStore((s) => s.addPlayedBall)
  const playedBalls = useMinigameStore((s) => s.playedBalls)
  const readyToPlay = useMinigameStore((s) => s.readyToPlay)
  const setHasPlayed = useMinigameStore((s) => s.setHasPlayed)
  const setReadyToPlay = useMinigameStore((s) => s.setReadyToPlay)

  const ballRef = useRef<RapierRigidBody>(null)
  const mousePos = useRef(new Vector2())
  const lastMousePos = useRef(new Vector2())
  const throwVelocity = useRef(new Vector2())

  // Use a ref to store vectors for position calculations to avoid recreating them each frame
  const positionVectors = useRef({
    dragPos: new Vector3(),
    dragStartPos: new Vector3(),
    currentBallPos: new Vector3(),
    targetPos: new Vector3(),
    currentRot: new Vector3()
  }).current

  const { camera } = useThree()
  const bounceCount = useRef(0)
  const resetProgress = useRef(0)
  const startResetPos = useRef(new Vector3())
  const timerInterval = useRef<NodeJS.Timeout | null>(null)
  const hasMovedSignificantly = useRef(false)
  const initialGrabPos = useRef(new Vector3())
  const isThrowable = useRef(true)
  const isUnmounting = useRef(false)

  const isTimerEnding = useRef(false)
  const isTimerLow = useRef(false)

  const resetState = useCallback(() => {
    resetProgress.current = 0
    bounceCount.current = 0
    isThrowable.current = true
    isTimerEnding.current = false
    isTimerLow.current = false
    setIsResetting(false)
    setIsDragging(false)
    setTimeRemaining(gameDuration)
    setIsGameActive(false)
    setShotMetrics({ angle: "0.0", probability: "0.0" })
    resetConsecutiveScores()
    setJustScored(false)

    if (!hasPlayed) {
      setScore(0)
    }

    startResetPos.current = new Vector3(
      initialPosition.x,
      initialPosition.y,
      initialPosition.z
    )
    positionVectors.dragPos = new Vector3()
    positionVectors.dragStartPos = new Vector3()
    positionVectors.currentBallPos = new Vector3()
    positionVectors.targetPos = new Vector3()
    positionVectors.currentRot = new Vector3()
    mousePos.current = new Vector2()
    lastMousePos.current = new Vector2()
    throwVelocity.current = new Vector2()
    initialGrabPos.current = new Vector3()
  }, [
    gameDuration,
    initialPosition,
    setIsResetting,
    setIsDragging,
    setScore,
    setTimeRemaining,
    setIsGameActive,
    setShotMetrics,
    resetConsecutiveScores,
    setJustScored,
    hasPlayed,
    positionVectors
  ])

  useEffect(() => {
    setIsBasketball(scene === "basketball")
  }, [scene, setIsBasketball])

  // stop round if we tab out of the page
  useEffect(() => {
    if (isBasketball && !isOnTab) {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
        timerInterval.current = null
      }

      removePlayedBall(0)
      clearPlayedBalls()

      setIsGameActive(false)
      setIsDragging(false)
      setScore(0)
      setTimeRemaining(gameDuration)
    }
  }, [
    isOnTab,
    isBasketball,
    clearPlayedBalls,
    setIsGameActive,
    setIsDragging,
    setTimeRemaining,
    gameDuration,
    setScore,
    removePlayedBall
  ])

  useEffect(() => {
    if (isBasketball && readyToPlay) {
      resetState()
      if (ballRef.current) {
        ballRef.current.setTranslation(initialPosition, true)
        ballRef.current.setBodyType(2, true)
        isThrowable.current = true
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
        timerInterval.current = null
      }
    }
  }, [
    isBasketball,
    readyToPlay,
    gameDuration,
    initialPosition,
    setIsResetting,
    setIsDragging,
    setIsGameActive,
    setScore,
    setTimeRemaining,
    setShotMetrics,
    resetState,
    hasPlayed
  ])

  const resetBallToInitialPosition = useCallback(
    (position?: { x: number; y: number; z: number }) => {
      // Don't reset if timer is ending or component is unmounting
      if (
        !isBasketball ||
        !ballRef.current ||
        isTimerEnding.current ||
        isUnmounting.current
      )
        return

      try {
        // If already resetting, don't start another reset
        if (isResetting) return

        // Create a new Vector3 instead of copying to avoid aliasing
        startResetPos.current = new Vector3(
          position?.x ?? initialPosition.x,
          position?.y ?? initialPosition.y,
          position?.z ?? initialPosition.z
        )

        setIsResetting(true)
        resetProgress.current = 0
        bounceCount.current = 0
        isThrowable.current = true

        if (!justScored) {
          resetConsecutiveScores()
        }
        setJustScored(false)
      } catch (error) {
        console.warn("Failed to reset ball position")
        setIsResetting(false)
        resetProgress.current = 0
      }
    },
    [
      initialPosition,
      setIsResetting,
      resetProgress,
      bounceCount,
      isThrowable,
      isBasketball,
      resetConsecutiveScores,
      justScored,
      setJustScored,
      isResetting
    ]
  )

  const startGame = useCallback(() => {
    if (!isGameActive) {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }

      setIsGameActive(true)
      setTimeRemaining(gameDuration)
      isTimerLow.current = false

      timerInterval.current = setInterval(() => {
        setTimeRemaining((prev) => {
          // Check if timer is below 0.4 seconds
          if (prev <= 0.4) {
            isTimerLow.current = true

            // If the user is currently dragging the ball, release it
            if (isDragging && ballRef.current) {
              setIsDragging(false)
              ballRef.current.setBodyType(0, true)
            }
          }

          if (prev <= 1) {
            if (timerInterval.current) {
              clearInterval(timerInterval.current)
              timerInterval.current = null

              // When timer is below 1 second, let the ball fall naturally
              // Set a flag to prevent any reset attempts
              isTimerEnding.current = true
              isTimerLow.current = true

              // release ball if held after game timeout
              if (isDragging && ballRef.current) {
                setIsDragging(false)
                ballRef.current.setBodyType(0, true)
              }

              // If the ball is currently resetting, cancel the reset
              if (isResetting) {
                setIsResetting(false)

                // If we have a ball reference, make sure it's a dynamic body
                if (ballRef.current) {
                  ballRef.current.setBodyType(0, true)
                }
              }

              // Let the ball fall naturally for a short time before ending the game
              setTimeout(() => {
                if (isUnmounting.current) return

                playSoundFX("TIMEOUT_BUZZER", 0.06)

                // if the ball is still in play, we add it to played balls
                // only if it doesn't already exist there
                if (ballRef.current && !isUnmounting.current) {
                  try {
                    // Create a completely separate copy of all ball data first
                    // to avoid any aliasing issues with the ball object
                    const ballTranslation = ballRef.current.translation()
                    const ballVelocity = ballRef.current.linvel()
                    const ballRotation = ballRef.current.rotation()

                    const currentPos = {
                      x: ballTranslation.x,
                      y: ballTranslation.y,
                      z: ballTranslation.z
                    }
                    const currentVel = {
                      x: ballVelocity.x,
                      y: ballVelocity.y,
                      z: ballVelocity.z
                    }
                    const currentRot = {
                      x: ballRotation.x,
                      y: ballRotation.y,
                      z: ballRotation.z
                    }

                    // check if ball was added already
                    const alreadyAdded = playedBalls.some(
                      (ball) =>
                        Math.abs(ball.position.x - currentPos.x) < 0.1 &&
                        Math.abs(ball.position.y - currentPos.y) < 0.1 &&
                        Math.abs(ball.position.z - currentPos.z) < 0.1
                    )

                    if (!alreadyAdded && !isUnmounting.current) {
                      addPlayedBall({
                        position: {
                          x: currentPos.x,
                          y: currentPos.y,
                          z: currentPos.z
                        },
                        velocity: {
                          x: currentVel.x,
                          y: currentVel.y,
                          z: currentVel.z
                        },
                        rotation: {
                          x: currentRot.x,
                          y: currentRot.y,
                          z: currentRot.z
                        }
                      })
                    }
                  } catch (error) {
                    console.warn("Final ball check failed:", error)
                  }
                }

                // Reset the timer ending flag after game is over
                isTimerEnding.current = false
                isTimerLow.current = false
                setIsGameActive(false)
                setHasPlayed(true)
                setReadyToPlay(false)
              }, 500) // Increased timeout to give the ball more time to fall
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }, [
    isGameActive,
    setIsGameActive,
    setTimeRemaining,
    gameDuration,
    setHasPlayed,
    addPlayedBall,
    setReadyToPlay,
    playSoundFX,
    isDragging,
    setIsDragging,
    playedBalls
  ])

  const handlePointerUp = useCallback(() => {
    utilsHandlePointerUp({
      ballRef,
      dragStartPos: positionVectors.dragStartPos,
      hasMovedSignificantly,
      isThrowable,
      hoopPosition,
      setIsDragging,
      isGameActive,
      startGame,
      upStrength,
      forwardStrength,
      playSoundFX
    })
  }, [
    isGameActive,
    hoopPosition,
    setIsDragging,
    upStrength,
    forwardStrength,
    startGame,
    playSoundFX,
    positionVectors.dragStartPos
  ])

  useEffect(() => {
    if (!isBasketball) return

    const handleGlobalPointerUp = () => {
      if (isDragging) {
        handlePointerUp()
      }
    }

    window.addEventListener("pointerup", handleGlobalPointerUp)
    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp)
    }
  }, [isDragging, isBasketball, handlePointerUp])

  useFrameCallback(({ pointer }, delta) => {
    if (!isBasketball) return

    if (isDragging && ballRef.current) {
      try {
        const ball = ballRef.current
        const nd = normalizeDelta(delta)

        throwVelocity.current.x =
          (mousePos.current.x - lastMousePos.current.x) / nd
        throwVelocity.current.y =
          (mousePos.current.y - lastMousePos.current.y) / nd
        lastMousePos.current.copy(mousePos.current)

        const distance = 4
        positionVectors.targetPos.set(pointer.x, pointer.y, 0.5)
        positionVectors.targetPos.unproject(camera)
        positionVectors.targetPos.sub(camera.position).normalize()
        positionVectors.targetPos.multiplyScalar(distance)
        positionVectors.targetPos.add(camera.position)

        // Apply constraints to the target position
        positionVectors.targetPos.x = Math.max(
          4.8,
          Math.min(5.6, positionVectors.targetPos.x)
        )
        positionVectors.targetPos.y = Math.max(
          1,
          Math.min(3, positionVectors.targetPos.y)
        )
        positionVectors.targetPos.z = Math.max(
          -11.2,
          Math.min(-10.2, positionVectors.targetPos.z)
        )

        // Get current ball position - create a copy to avoid aliasing
        const translation = ball.translation()
        positionVectors.currentBallPos.set(
          translation.x,
          translation.y,
          translation.z
        )

        // Get current ball rotation - create a copy to avoid aliasing
        const rotation = ball.rotation()
        positionVectors.currentRot.set(rotation.x, rotation.y, rotation.z)

        // Interpolate towards the target position with smooth lerp
        const lerpFactor = 0.2
        positionVectors.dragPos.lerpVectors(
          positionVectors.currentBallPos,
          positionVectors.targetPos,
          Math.min(1, lerpFactor * (1 / normalizeDelta(delta)))
        )

        if (
          !isNaN(positionVectors.dragPos.x) &&
          !isNaN(positionVectors.dragPos.y) &&
          !isNaN(positionVectors.dragPos.z)
        ) {
          // Create a new position object to avoid aliasing
          const newPosition = {
            x: positionVectors.dragPos.x,
            y: positionVectors.dragPos.y,
            z: positionVectors.dragPos.z
          }
          ball.setTranslation(newPosition, true)
        } else {
          setIsDragging(false)
          resetBallToInitialPosition()
        }
      } catch (error) {
        console.warn("Failed to update ball position, physics might be paused")
        setIsDragging(false)
      }
    }

    // reset ball anim
    if (isResetting && ballRef.current) {
      try {
        resetProgress.current += delta * 3
        const progress = MathUtils.clamp(resetProgress.current, 0, 1)
        const easedProgress = easeInOutCubic(progress)

        // Create a completely new Vector3 for the new position
        const targetPosition = new Vector3(
          initialPosition.x,
          initialPosition.y,
          initialPosition.z
        )

        const newPosition = new Vector3().lerpVectors(
          startResetPos.current,
          targetPosition,
          easedProgress
        )

        if (
          !isNaN(newPosition.x) &&
          !isNaN(newPosition.y) &&
          !isNaN(newPosition.z)
        ) {
          // Create a plain object for the position to avoid any aliasing with Vector3
          const positionToSet = {
            x: newPosition.x,
            y: newPosition.y,
            z: newPosition.z
          }
          // Get a fresh reference to the ball
          const ball = ballRef.current
          ball.setTranslation(positionToSet, true)
        } else {
          console.warn("invalid position during ball reset")
          setIsResetting(false)
          resetProgress.current = 0
          // Create a plain object for the position
          const initialPos = {
            x: initialPosition.x,
            y: initialPosition.y,
            z: initialPosition.z
          }
          // Get a fresh reference to the ball
          const ball = ballRef.current
          ball.setTranslation(initialPos, true)
        }

        if (progress === 1) {
          setIsResetting(false)
          resetProgress.current = 0
          // Get a fresh reference to the ball
          const ball = ballRef.current
          ball.setBodyType(2, true)
        }
      } catch (error) {
        console.warn("Failed to reset ball animation, physics might be paused")
        setIsResetting(false)
        resetProgress.current = 0
      }
    }
  })

  // Add safety for unmounting
  useEffect(() => {
    return () => {
      isUnmounting.current = true
      isTimerEnding.current = false
      isTimerLow.current = false

      // Clear references to prevent errors during unmount
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
        timerInterval.current = null
      }

      // Ensure we're not in the middle of a reset when unmounting
      setIsResetting(false)
      resetProgress.current = 0
    }
  }, [setIsResetting])

  const handlePointerDown = useCallback(
    (event: any) => {
      // Don't allow grabbing the ball when timer is low
      if (isTimerLow.current) return

      utilsHandlePointerDown({
        event,
        ballRef,
        mousePos,
        lastMousePos,
        dragStartPos: positionVectors.dragStartPos,
        initialGrabPos,
        hasMovedSignificantly,
        isThrowable,
        hoopPosition,
        setIsDragging,
        setShotMetrics
      })
    },
    [hoopPosition, setIsDragging, setShotMetrics, positionVectors.dragStartPos]
  )

  const handlePointerMove = useCallback(
    (event: any) => {
      if (!isDragging) return

      utilsHandlePointerMove({
        event,
        ballRef,
        mousePos,
        lastMousePos,
        dragStartPos: positionVectors.dragStartPos,
        initialGrabPos,
        hasMovedSignificantly,
        isThrowable,
        hoopPosition,
        setIsDragging,
        setShotMetrics
      })
    },
    [
      isDragging,
      hoopPosition,
      setIsDragging,
      setShotMetrics,
      positionVectors.dragStartPos
    ]
  )

  const hoopMeshes = useMesh((state) => state.hoopMeshes)

  const clonedHoopRef = useRef<THREE.Mesh | null>(null)

  useEffect(() => {
    if (hoopMeshes.hoop && !clonedHoopRef.current) {
      clonedHoopRef.current = hoopMeshes.hoop.clone()

      hoopMeshes.hoop.visible = true
      if (hoopMeshes.hoopGlass) {
        hoopMeshes.hoopGlass.visible = true
      }
    }

    return () => {
      if (hoopMeshes.hoop) {
        hoopMeshes.hoop.visible = true
      }
      if (hoopMeshes.hoopGlass) {
        hoopMeshes.hoopGlass.visible = true
      }

      clonedHoopRef.current = null
    }
  }, [hoopMeshes])

  if (!isBasketball) return null

  return (
    <>
      {hoopMeshes.hoop && clonedHoopRef.current && (
        <RigidBody type="fixed" colliders="trimesh">
          <primitive object={clonedHoopRef.current} />
        </RigidBody>
      )}

      {readyToPlay && (
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
            isTimerEnding={isTimerEnding.current}
            isTimerLow={isTimerLow.current}
          />
        </>
      )}

      <RigidBodies hoopPosition={hoopPosition} />
    </>
  )
}

export const HoopMinigame = memo(HoopMinigameInner)
