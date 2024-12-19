import { Html } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier"
import { Geist_Mono } from "next/font/google"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { MathUtils, Vector2, Vector3 } from "three"

import { useMinigameStore } from "@/store/minigame-store"
import { easeInOutCubic } from "@/utils/animations"

const geistMono = Geist_Mono({ subsets: ["latin"], weight: "variable" })

export const HoopMinigame = () => {
  const isBasketball = usePathname() === "/basketball"
  // @ts-ignore
  const ballRef = useRef<RigidBody>(null)
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
    setIsDragging
  } = useMinigameStore()

  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }
      setIsResetting(false)
      setIsDragging(false)
    }
    // might wanna remove deps
  }, [setIsResetting, setIsDragging])

  const startGame = () => {
    if (!isGameActive) {
      setIsGameActive(true)
      timerInterval.current = setInterval(() => {
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

  const resetBallToInitialPosition = () => {
    if (ballRef.current) {
      const currentPos = ballRef.current.translation()
      startResetPos.current.set(currentPos.x, currentPos.y, currentPos.z)

      ballRef.current.setLinvel({ x: 0, y: 0, z: 0 })
      ballRef.current.setAngvel({ x: 0, y: 0, z: 0 })
      setIsResetting(true)
      bounceCount.current = 0
    }
  }

  useFrame(({ pointer }, delta) => {
    if (!isBasketball) return

    if (isDragging && ballRef.current) {
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

      ballRef.current.setTranslation(dragPos.current)
    }

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

        ballRef.current.setTranslation(newPosition)

        if (progress === 1) {
          setIsResetting(false)
          resetProgress.current = 0
          ballRef.current.setBodyType(2)
        }
      } catch (error) {
        setIsResetting(false)
        resetProgress.current = 0
      }
    }
  })

  const handlePointerDown = (event: any) => {
    event.stopPropagation()
    setIsDragging(true)
    if (ballRef.current) {
      const pos = ballRef.current.translation()
      dragStartPos.current.set(pos.x, pos.y, pos.z)

      mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1
      lastMousePos.current.copy(mousePos.current)
    }
  }

  const handlePointerMove = (event: any) => {
    if (isDragging) {
      mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
  }

  const handlePointerUp = () => {
    if (isDragging && ballRef.current) {
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

      if (dragDistance > 0.1) {
        ballRef.current.setBodyType("dynamic")

        const baseThrowStrength = 1.5
        const throwStrength = Math.min(baseThrowStrength * dragDistance, 3)

        const distanceToHoop = Math.abs(hoopPosition.z - currentPos.z)
        const heightDifference = hoopPosition.y - currentPos.y
        const ballHorizontalOffset = (currentPos.x - hoopPosition.x) * 0.075

        ballRef.current.applyImpulse(
          {
            x: -dragDelta.x * throwStrength * 0.015 - ballHorizontalOffset,
            y: heightDifference * upStrength * throwStrength,
            z: -distanceToHoop * throwStrength * forwardStrength
          },
          true
        )

        // Backspin
        ballRef.current.applyTorqueImpulse({ x: 0.02, y: 0, z: 0 }, true)
      }

      setIsDragging(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  if (isBasketball) {
    return (
      <>
        {/* basketball */}
        <RigidBody
          restitution={0.9}
          colliders="ball"
          ref={ballRef}
          type="fixed"
          position={[initialPosition.x, initialPosition.y, initialPosition.z]}
          onCollisionEnter={({ other }) => {
            if (!isDragging && other.rigidBodyObject?.name === "floor") {
              bounceCount.current += 1
              if (bounceCount.current >= 2) {
                resetBallToInitialPosition()
              }
            }
          }}
          onSleep={resetBallToInitialPosition}
        >
          <mesh
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <sphereGeometry args={[0.22, 32, 32]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        </RigidBody>

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
          position={[hoopPosition.x, 0, hoopPosition.z + 3]}
        >
          <CuboidCollider args={[3.5, 0.1, 3.5]} />
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
              setScore((prev) => prev + 1)
            }}
          />
        </RigidBody>

        <Html
          position={[hoopPosition.x - 2.35, hoopPosition.y + 1, hoopPosition.z]}
        >
          <div
            className={`${geistMono.className} flex w-48 flex-col items-end text-brand-w2`}
          >
            <div className="flex w-full justify-between">
              <small className="text-[11px] text-brand-g1">T:</small>
              <p className="text-[51px] leading-none">
                {formatTime(timeRemaining)}
              </p>
            </div>
            <div className="flex w-full justify-between">
              <small className="text-[11px] text-brand-g1">S:</small>
              <p className="text-[51px] leading-none">{score}</p>
            </div>
          </div>
        </Html>
      </>
    )
  }
  return null
}
