import { Html } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { Geist_Mono } from "next/font/google"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { MathUtils, Vector2, Vector3 } from "three"

import { useMinigameStore } from "@/store/minigame-store"
import { easeInOutCubic } from "@/utils/animations"

import { Trajectory } from "./trajectory"

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
  const { camera, clock } = useThree()
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
    setIsDragging,
    shotMetrics,
    setShotMetrics
  } = useMinigameStore()

  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
        timerInterval.current = null
      }
      setIsResetting(false)
      setIsDragging(false)
    }
    // might wanna remove deps
  }, [setIsResetting, setIsDragging])

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDragging) {
        handlePointerUp()
      }
    }

    window.addEventListener("pointerup", handleGlobalPointerUp)

    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp)
    }
  }, [isDragging])

  const startGame = () => {
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
      if (isNaN(currentPos.x) || isNaN(currentPos.y) || isNaN(currentPos.z)) {
        startResetPos.current.copy(
          new Vector3(initialPosition.x, initialPosition.y, initialPosition.z)
        )
      } else {
        startResetPos.current.set(currentPos.x, currentPos.y, currentPos.z)
      }

      ballRef.current.setLinvel({ x: 0, y: 0, z: 0 })
      ballRef.current.setAngvel({ x: 0, y: 0, z: 0 })
      setIsResetting(true)
      bounceCount.current = 0
    }
  }

  useFrame(({ pointer, clock }, delta) => {
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
          ballRef.current.setTranslation(newPosition)
        } else {
          console.warn("invalid position during ball reset")
          setIsResetting(false)
          resetProgress.current = 0
          ballRef.current.setTranslation(initialPosition)
        }

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
    mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1
    mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1

    if (isDragging && ballRef.current) {
      const currentPos = ballRef.current.translation()
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

      if (dragDistance > 0.1) {
        ballRef.current.setBodyType("dynamic")

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
      }

      setIsDragging(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
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
            if (!isDragging) {
              if (other.rigidBodyObject?.name === "floor") {
                bounceCount.current += 1
                if (bounceCount.current >= 2) {
                  resetBallToInitialPosition()
                }
              }
              //TODO: maybe add points for close shots
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
              setScore((prev) => prev + 1000)
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
              <p className="text-[51px] leading-none">{Math.floor(score)}</p>
            </div>
          </div>
        </Html>

        <Html
          position={[hoopPosition.x + 1.15, hoopPosition.y + 1, hoopPosition.z]}
        >
          <div
            className={`${geistMono.className} flex w-48 flex-col items-start text-[11px] text-brand-w2`}
          >
            <p className="leading-none">θ = {shotMetrics.angle}° ± 0.2°</p>
            <p className="leading-none">{shotMetrics.probability}%</p>
          </div>
        </Html>
      </>
    )
  }
  return null
}
