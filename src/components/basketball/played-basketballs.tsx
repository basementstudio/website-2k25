import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { useEffect, useMemo, useRef } from "react"
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
  const setPlayedBallMaterial = useMinigameStore(
    (state) => state.setPlayedBallMaterial
  )
  const addStaticBall = useMinigameStore((state) => state.addStaticBall)
  const isGameActive = useMinigameStore((state) => state.isGameActive)

  // @ts-ignore
  const rigidBodies = useRef<(RigidBody | null)[]>([])
  const processedBalls = useRef<Set<number>>(new Set())

  const geometry = useMemo(
    () => (basketballModel.scene.children[0] as Mesh).geometry,
    [basketballModel]
  )

  const originalMaterial = basketballModel.materials[
    "Material.001"
  ] as MeshStandardMaterial

  // useEffect(() => {
  //   if (!playedBallMaterial) {
  //     const material = createGlobalShaderMaterial(originalMaterial, true)
  //     setPlayedBallMaterial(material)
  //   }
  // }, [basketballModel, playedBallMaterial, setPlayedBallMaterial])

  useEffect(() => {
    if (isGameActive) {
      processedBalls.current.clear()
    }
  }, [isGameActive])

  useEffect(() => {
    const checkVelocities = setInterval(() => {
      if (!isGameActive) {
        rigidBodies.current.forEach((rigidBody, index) => {
          if (!rigidBody || processedBalls.current.has(index)) return

          const velocity = rigidBody.linvel()
          const speed = new Vector3(velocity.x, velocity.y, velocity.z).length()

          if (speed < VELOCITY_THRESHOLD) {
            const position = rigidBody.translation()
            const rotation = rigidBody.rotation()

            addStaticBall({
              position: { x: position.x, y: position.y, z: position.z },
              rotation: { x: rotation.x, y: rotation.y, z: rotation.z }
            })

            processedBalls.current.add(index)
          }
        })
      }
    }, 100)

    return () => clearInterval(checkVelocities)
  }, [isGameActive, addStaticBall])

  if (!playedBallMaterial) return null

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
          ref={(instance) => {
            rigidBodies.current[index] = instance
          }}
        >
          <mesh
            geometry={geometry}
            material={originalMaterial}
            scale={1.7}
            material-metalness={0}
            material-roughness={0.8}
          />
        </RigidBody>
      ))}
    </>
  )
}
