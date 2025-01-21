import { useFrame, useThree } from "@react-three/fiber"
import { RapierRigidBody } from "@react-three/rapier"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"
import { MathUtils, Vector2, Vector3 } from "three"

import { useSiteAudio } from "@/hooks/use-site-audio"
import { useCustomShaderMaterial } from "@/shaders/material-global-shader"
import { useMinigameStore } from "@/store/minigame-store"
import { easeInOutCubic } from "@/utils/animations"
import {
  handlePointerDown as utilsHandlePointerDown,
  handlePointerMove as utilsHandlePointerMove,
  handlePointerUp as utilsHandlePointerUp
} from "@/utils/basketball-utils"

import { Basketball } from "./basketball"
import RigidBodies from "./rigid-bodies"
import { Trajectory } from "./trajectory"

export const HoopMinigame = () => {
  const isBasketball = usePathname() === "/basketball"
  const { playSoundFX } = useSiteAudio()
  const { setIsBasketball } = useCustomShaderMaterial()

  useEffect(() => {
    setIsBasketball(isBasketball)
  }, [isBasketball, setIsBasketball])

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
    setShotMetrics,
    setHasPlayed,
    addPlayedBall,
    readyToPlay,
    setReadyToPlay
  } = useMinigameStore()

  const resetState = useCallback(() => {
    resetProgress.current = 0
    bounceCount.current = 0
    isThrowable.current = true
    setIsResetting(false)
    setIsDragging(false)
    setScore(0)
    setTimeRemaining(gameDuration)
    setIsGameActive(false)
    setShotMetrics({ angle: "0.0", probability: "0.0" })

    startResetPos.current = new Vector3(
      initialPosition.x,
      initialPosition.y,
      initialPosition.z
    )
    dragPos.current = new Vector3()
    dragStartPos.current = new Vector3()
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
    setShotMetrics
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
      resetState()
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
    resetState
  ])

  const resetBallToInitialPosition = useCallback(
    (position?: { x: number; y: number; z: number }) => {
      if (!isBasketball || !ballRef.current) return
      try {
        startResetPos.current.copy(
          new Vector3(
            position?.x ?? initialPosition.x,
            position?.y ?? initialPosition.y,
            position?.z ?? initialPosition.z
          )
        )

        setIsResetting(true)
        resetProgress.current = 0
        bounceCount.current = 0
        isThrowable.current = true
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
      isBasketball
    ]
  )

  const startGame = useCallback(() => {
    if (!isGameActive) {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }

      setIsGameActive(true)
      setTimeRemaining(gameDuration)

      timerInterval.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerInterval.current) {
              clearInterval(timerInterval.current)
              playSoundFX("TIMEOUT_BUZZER")
            }
            setIsGameActive(false)
            setHasPlayed(true)
            setReadyToPlay(false)

            if (ballRef.current) {
              const currentPos = ballRef.current.translation()
              const currentVel = ballRef.current.linvel()

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
                }
              })
            }

            return gameDuration
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
    playSoundFX
  ])

  const handlePointerUp = useCallback(() => {
    utilsHandlePointerUp({
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
    })
  }, [
    isGameActive,
    hoopPosition,
    setIsDragging,
    upStrength,
    forwardStrength,
    startGame,
    playSoundFX
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

  const handlePointerDown = useCallback(
    (event: any) => {
      utilsHandlePointerDown({
        event,
        ballRef,
        mousePos,
        lastMousePos,
        dragStartPos,
        initialGrabPos,
        hasMovedSignificantly,
        isThrowable,
        hoopPosition,
        setIsDragging,
        setShotMetrics
      })
    },
    [hoopPosition, setIsDragging, setShotMetrics]
  )

  const handlePointerMove = useCallback(
    (event: any) => {
      if (!isDragging) return

      utilsHandlePointerMove({
        event,
        ballRef,
        mousePos,
        lastMousePos,
        dragStartPos,
        initialGrabPos,
        hasMovedSignificantly,
        isThrowable,
        hoopPosition,
        setIsDragging,
        setShotMetrics
      })
    },
    [isDragging, hoopPosition, setIsDragging, setShotMetrics]
  )

  if (!isBasketball) return null

  return (
    <>
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
          />

          <Trajectory
            ballRef={ballRef}
            isDragging={isDragging}
            isResetting={isResetting}
          />
        </>
      )}

      <RigidBodies hoopPosition={hoopPosition} />
    </>
  )
}
