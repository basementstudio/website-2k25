import { Html } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { Geist_Mono } from "next/font/google"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { MathUtils, Vector2, Vector3 } from "three"

import { easeInOutCubic } from "@/utils/animations"

const geistMono = Geist_Mono({ subsets: ["latin"], weight: "variable" })

const INITIAL_POSITION = { x: 5.2, y: 1.3, z: -10.7 }
const HOOP_POSITION = { x: 5.23, y: 3.414, z: -14.412 }

const FORWARD_STRENGTH = 0.045
const UP_STRENGTH = 0.15
const GAME_DURATION = 45 // 45 seconds

export const HoopMinigame = () => {
  const isBasketball = usePathname() === "/basketball"
  // @ts-ignore
  const ballRef = useRef<RigidBody>(null)
  const [isDragging, setIsDragging] = useState(false)
  const mousePos = useRef(new Vector2())
  const lastMousePos = useRef(new Vector2())
  const throwVelocity = useRef(new Vector2())
  const dragPos = useRef(new Vector3())
  const dragStartPos = useRef(new Vector3())
  const { camera } = useThree()
  const bounceCount = useRef(0)
  const [isResetting, setIsResetting] = useState(false)
  const resetProgress = useRef(0)
  const startResetPos = useRef(new Vector3())
  const [score, setScore] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION)
  const [isGameActive, setIsGameActive] = useState(false)
  const timerInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }
      setIsResetting(false)
      setIsDragging(false)
    }
  }, [])

  const startGame = () => {
    if (!isGameActive) {
      setIsGameActive(true)
      timerInterval.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Game over
            if (timerInterval.current) {
              clearInterval(timerInterval.current)
            }
            setIsGameActive(false)
            resetGame()
            return GAME_DURATION
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  const resetGame = () => {
    setScore(0)
    setTimeRemaining(GAME_DURATION)
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
      resetProgress.current += delta * 3
      const progress = MathUtils.clamp(resetProgress.current, 0, 1)
      const easedProgress = easeInOutCubic(progress)

      const newPosition = new Vector3().lerpVectors(
        startResetPos.current,
        new Vector3(INITIAL_POSITION.x, INITIAL_POSITION.y, INITIAL_POSITION.z),
        easedProgress
      )

      ballRef.current.setTranslation(newPosition)

      if (progress === 1) {
        setIsResetting(false)
        resetProgress.current = 0
        ballRef.current.setBodyType(2)
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
      // Start the game on first throw
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

        const distanceToHoop = Math.abs(HOOP_POSITION.z - currentPos.z)
        const heightDifference = HOOP_POSITION.y - currentPos.y
        const ballHorizontalOffset = (currentPos.x - HOOP_POSITION.x) * 0.075

        ballRef.current.applyImpulse(
          {
            x: -dragDelta.x * throwStrength * 0.015 - ballHorizontalOffset,
            y: heightDifference * UP_STRENGTH * throwStrength,
            z: -distanceToHoop * throwStrength * FORWARD_STRENGTH
          },
          true
        )

        // Backspin
        ballRef.current.applyTorqueImpulse({ x: 0.02, y: 0, z: 0 }, true)
      }

      setIsDragging(false)
    }
  }

  // Format time as M:SS
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
          position={[
            INITIAL_POSITION.x,
            INITIAL_POSITION.y,
            INITIAL_POSITION.z
          ]}
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
          position={[HOOP_POSITION.x, HOOP_POSITION.y, HOOP_POSITION.z - 0.1]}
        >
          <CuboidCollider args={[2.5, 3.5, 0.1]} />
        </RigidBody>

        {/* invisible floor */}
        <RigidBody
          type="fixed"
          name="floor"
          position={[HOOP_POSITION.x, 0, HOOP_POSITION.z + 3]}
        >
          <CuboidCollider args={[3.5, 0.1, 3.5]} />
        </RigidBody>

        {/* score detection */}
        <RigidBody
          type="fixed"
          position={[
            HOOP_POSITION.x - 0.04,
            HOOP_POSITION.y - 0.35,
            HOOP_POSITION.z + 0.35
          ]}
          sensor
        >
          <CuboidCollider
            args={[0.05, 0.05, 0.05]}
            onIntersectionEnter={() => {
              setScore((prev) => prev + 1)
              console.log("score", score + 1)
            }}
          />
        </RigidBody>

        <Html
          position={[
            HOOP_POSITION.x - 2.35,
            HOOP_POSITION.y + 1,
            HOOP_POSITION.z
          ]}
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
