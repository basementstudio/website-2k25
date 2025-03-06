import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { useEffect, useMemo, useRef, useState } from "react"
import { Mesh, MeshStandardMaterial, Vector3 } from "three"

import { createGlobalShaderMaterial } from "@/shaders/material-global-shader"
import { useMinigameStore } from "@/store/minigame-store"

import { useAssets } from "../assets-provider"

const VELOCITY_THRESHOLD = 0.1

export const PlayedBasketballs = () => {
  const { basketball } = useAssets()
  const basketballModel = useGLTF(basketball)
  const playedBalls = useMinigameStore((state) => state.playedBalls)
  const playedBallMaterial = useMinigameStore(
    (state) => state.playedBallMaterial
  )

  const addStaticBall = useMinigameStore((state) => state.addStaticBall)
  const isGameActive = useMinigameStore((state) => state.isGameActive)

  // @ts-ignore
  const rigidBodies = useRef<(RigidBody | null)[]>([])
  const processedBalls = useRef<Set<number>>(new Set())
  const isSafeToProcess = useRef<boolean>(true)

  // keep track of processed balls we should remove
  const [hiddenBalls, setHiddenBalls] = useState<Set<number>>(new Set())

  const geometry = useMemo(
    () => (basketballModel.scene.children[0] as Mesh).geometry,
    [basketballModel]
  )

  const originalMaterial = basketballModel.materials[
    "Material.002"
  ] as MeshStandardMaterial

  const material = useMemo(() => {
    const mat = createGlobalShaderMaterial(originalMaterial.clone(), false, {
      LIGHT: true
    })
    mat.uniforms.uLoaded.value = 1
    mat.uniforms.lightDirection.value = new Vector3(0, 0, 1)
    return mat
  }, [originalMaterial])

  useEffect(() => {
    if (isGameActive) {
      processedBalls.current.clear()
      rigidBodies.current = []
      isSafeToProcess.current = true
      setHiddenBalls(new Set())
    }
  }, [isGameActive, playedBalls])

  // safe delay if game is inactive
  useEffect(() => {
    if (!isGameActive) {
      isSafeToProcess.current = false
      const timer = setTimeout(() => {
        isSafeToProcess.current = true
      }, 150)

      return () => clearTimeout(timer)
    }
  }, [isGameActive])

  useEffect(() => {
    if (!isGameActive) {
      const checkVelocities = setInterval(() => {
        // skip processing if its not safe yet
        if (!isSafeToProcess.current) return

        rigidBodies.current.forEach((rigidBody, index) => {
          if (!rigidBody || processedBalls.current.has(index)) return

          try {
            const velocity = rigidBody.linvel()
            const speed = new Vector3(
              velocity.x,
              velocity.y,
              velocity.z
            ).length()

            if (speed < VELOCITY_THRESHOLD) {
              try {
                const position = rigidBody.translation()
                const rotation = rigidBody.rotation()

                // for balls that are on or close to the floor, use their actual position, and for
                // the balls that are high up, wait for them to come down and settle
                if (position.y <= 0.36) {
                  const staticPosition = {
                    x: position.x,
                    y: Math.min(position.y, 0.36),
                    z: position.z
                  }

                  addStaticBall({
                    position: staticPosition,
                    rotation: { x: rotation.x, y: rotation.y, z: rotation.z }
                  })

                  // hide dynamic ball after its converted to static
                  setHiddenBalls((prev) => {
                    const next = new Set(prev)
                    next.add(index)
                    return next
                  })

                  processedBalls.current.add(index)
                }
                // if the ball is high up, we don't create a static version yet
                // check again on the next interval
              } catch (error) {
                console.warn("Error accessing rigid body properties:", error)
                processedBalls.current.add(index)
              }
            }
          } catch (error) {
            console.warn("Error checking rigid body velocity:", error)
            processedBalls.current.add(index)
          }
        })
      }, 100)

      return () => {
        clearInterval(checkVelocities)
      }
    }
  }, [isGameActive, addStaticBall])

  // fallback for any balls that never settle
  useEffect(() => {
    if (!isGameActive && playedBalls.length > 0) {
      // convert remaining balls after 2 seconds
      const fallbackTimeout = setTimeout(() => {
        console.warn("Applying fallback for any remaining balls")

        playedBalls.forEach((ball, index) => {
          if (!processedBalls.current.has(index)) {
            try {
              const rigidBody = rigidBodies.current[index]
              if (rigidBody) {
                const position = rigidBody.translation()
                const rotation = rigidBody.rotation()

                const y = position.y > 0.36 ? 0.26 : position.y

                addStaticBall({
                  position: { x: position.x, y, z: position.z },
                  rotation: { x: rotation.x, y: rotation.y, z: rotation.z }
                })

                setHiddenBalls((prev) => {
                  const next = new Set(prev)
                  next.add(index)
                  return next
                })
              } else {
                addStaticBall({
                  position: {
                    x: ball.position.x,
                    y: ball.position.y > 0.36 ? 0.26 : ball.position.y,
                    z: ball.position.z
                  },
                  rotation: { x: 0, y: 0, z: 0 }
                })
              }
            } catch (error) {
              // user initial pos as fallback
              addStaticBall({
                position: {
                  x: ball.position.x,
                  y: ball.position.y > 0.36 ? 0.26 : ball.position.y,
                  z: ball.position.z
                },
                rotation: { x: 0, y: 0, z: 0 }
              })
            }

            processedBalls.current.add(index)
          }
        })
      }, 2000)

      return () => clearTimeout(fallbackTimeout)
    }
  }, [isGameActive, playedBalls, addStaticBall])

  if (!playedBallMaterial) return null

  return (
    <>
      {playedBalls.map(
        (ball, index) =>
          !hiddenBalls.has(index) && (
            <RigidBody
              key={index}
              restitution={0.85}
              colliders="ball"
              type="dynamic"
              position={[ball.position.x, ball.position.y, ball.position.z]}
              linearVelocity={[
                ball.velocity.x,
                ball.velocity.y,
                ball.velocity.z
              ]}
              friction={0.8}
              linearDamping={0.5}
              angularDamping={0.5}
              ref={(instance) => {
                rigidBodies.current[index] = instance
              }}
            >
              <mesh
                raycast={() => null}
                geometry={geometry}
                material={material}
                scale={1.7}
                userData={{ hasGlobalMaterial: true }}
              />
            </RigidBody>
          )
      )}
    </>
  )
}
