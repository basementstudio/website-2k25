import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
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
  const ballsToProcess = useRef<
    Map<
      number,
      {
        checkCount: number
        lastCheck: number
      }
    >
  >(new Map())

  // limit frequency of physics operations
  const frameCounter = useRef(0)

  // track when game became inactive to handle cleanup
  const gameDeactivationTime = useRef(0)
  const hasAddedFallbackBalls = useRef(false)

  // flag to prevent physics access during unmounting
  const isUnmounting = useRef(false)

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

  // prevent accessing physics objects during unmount
  useEffect(() => {
    return () => {
      isUnmounting.current = true
      rigidBodies.current = []
    }
  }, [])

  // reset state when game becomes active
  useEffect(() => {
    if (isGameActive) {
      processedBalls.current.clear()
      rigidBodies.current = []
      ballsToProcess.current.clear()
      hasAddedFallbackBalls.current = false
    } else {
      gameDeactivationTime.current = Date.now()
    }
  }, [isGameActive])

  useFrame(() => {
    if (isUnmounting.current || isGameActive) return

    frameCounter.current++

    // throttle physics checks
    if (frameCounter.current % 5 !== 0) return

    // get current time since deactivation
    const timeSinceDeactivation = Date.now() - gameDeactivationTime.current

    // handle safe physics checks for the first 2 seconds after game ends
    if (timeSinceDeactivation < 2000 && playedBalls.length > 0) {
      // check unprocessed rigid bodies
      rigidBodies.current.forEach((rigidBody, index) => {
        if (
          !rigidBody ||
          processedBalls.current.has(index) ||
          isUnmounting.current
        )
          return

        // track unprocessed ball
        if (!ballsToProcess.current.has(index)) {
          ballsToProcess.current.set(index, {
            checkCount: 0,
            lastCheck: Date.now()
          })
        }

        try {
          const ballData = ballsToProcess.current.get(index)!
          const timeSinceLastCheck = Date.now() - ballData.lastCheck

          if (timeSinceLastCheck < 100) return

          // update last check time and count
          ballData.lastCheck = Date.now()
          ballData.checkCount++

          // check velocity
          let speed = 1
          let position = { x: 0, y: 0, z: 0 }
          let rotation = { x: 0, y: 0, z: 0 }

          try {
            if (isUnmounting.current) return

            const velocity = rigidBody.linvel()
            speed = new Vector3(velocity.x, velocity.y, velocity.z).length()

            position = rigidBody.translation()
            rotation = rigidBody.rotation()
          } catch (error) {
            console.warn("Error accessing physics properties:", error)
            processedBalls.current.add(index)
            return
          }

          // ball has stopped or is moving very slowly
          if (speed < VELOCITY_THRESHOLD) {
            // don't process balls that are too high off the ground yet
            if (position.y > 0.6 && ballData.checkCount < 10) {
              // let it fall naturally for a bit
              return
            }

            const y = position.y > 0.36 ? 0.26 : position.y

            addStaticBall({
              position: {
                x: position.x,
                y,
                z: position.z
              },
              rotation: { x: rotation.x, y: rotation.y, z: rotation.z }
            })

            processedBalls.current.add(index)
          }
          // force process ball if for some reason its still moving
          else if (ballData.checkCount > 15) {
            addStaticBall({
              position: {
                x: position.x,
                y: position.y > 0.36 ? 0.26 : position.y,
                z: position.z
              },
              rotation: { x: rotation.x, y: rotation.y, z: rotation.z }
            })

            processedBalls.current.add(index)
          }
        } catch (error) {
          console.warn("Error during velocity check:", error)
          processedBalls.current.add(index)
        }
      })
    }
    // after 2 seconds, ensure any remaining balls are processed
    else if (
      timeSinceDeactivation >= 2000 &&
      !hasAddedFallbackBalls.current &&
      playedBalls.length > 0
    ) {
      hasAddedFallbackBalls.current = true

      // process remaining balls
      playedBalls.forEach((ball, index) => {
        if (!processedBalls.current.has(index)) {
          addStaticBall({
            position: {
              x: ball.position.x,
              y: ball.position.y > 0.36 ? 0.26 : ball.position.y,
              z: ball.position.z
            },
            rotation: { x: 0, y: 0, z: 0 }
          })
          processedBalls.current.add(index)
        }
      })
    }
  })

  if (!playedBallMaterial) return null

  const setRigidBodyRef = (instance: any | null, index: number) => {
    if (!isUnmounting.current) {
      rigidBodies.current[index] = instance
    }
  }

  return (
    <>
      {playedBalls.map((ball, index) => (
        <RigidBody
          key={index}
          restitution={0.85}
          colliders="ball"
          type="dynamic"
          position={[ball.position.x, ball.position.y, ball.position.z]}
          linearVelocity={[ball.velocity.x, ball.velocity.y, ball.velocity.z]}
          friction={0.8}
          linearDamping={0.5}
          angularDamping={0.5}
          ref={(instance) => setRigidBodyRef(instance, index)}
        >
          <mesh
            raycast={() => null}
            geometry={geometry}
            material={material}
            scale={1.7}
            userData={{ hasGlobalMaterial: true }}
            visible={!processedBalls.current.has(index)}
          />
        </RigidBody>
      ))}
    </>
  )
}
