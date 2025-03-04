import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { RefObject, useEffect, useMemo, useRef } from "react"
import { Mesh, MeshStandardMaterial } from "three"

import { useCursor } from "@/hooks/use-mouse"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { createGlobalShaderMaterial } from "@/shaders/material-global-shader"

import { useAssets } from "../assets-provider"

interface BasketballProps {
  ballRef: RefObject<any>
  initialPosition: { x: number; y: number; z: number }
  isDragging: boolean
  hoopPosition: { x: number; y: number; z: number }
  resetBallToInitialPosition: (position?: {
    x: number
    y: number
    z: number
  }) => void
  handlePointerDown: (event: any) => void
  handlePointerMove: (event: any) => void
  handlePointerUp: (event: any) => void
}

export const Basketball = ({
  ballRef,
  initialPosition,
  isDragging,
  resetBallToInitialPosition,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp
}: BasketballProps) => {
  const { playSoundFX } = useSiteAudio()
  const setCursor = useCursor()
  const { basketball } = useAssets()
  const basketballModel = useGLTF(basketball)
  const bounceCount = useRef(0)

  const geometry = useMemo(
    () => (basketballModel.scene.children[0] as Mesh).geometry,
    [basketballModel]
  )

  const originalMaterial = basketballModel.materials[
    "Material.001"
  ] as MeshStandardMaterial

  const material = useMemo(() => {
    return createGlobalShaderMaterial(originalMaterial, true)
  }, [basketballModel])

  const handleCollision = (other: any) => {
    const randomVolume = 0.1 + Math.random() * 0.1
    const randomPitch = 0.95 + Math.random() * 0.1
    const decreaseVolumeOnBounce = bounceCount.current > 0 ? 0.5 : 0.75

    playSoundFX(
      "BASKETBALL_THUMP",
      randomVolume * decreaseVolumeOnBounce,
      randomPitch
    )
    if (!isDragging) {
      if (other.rigidBodyObject?.name === "floor") {
        bounceCount.current += 1

        if (bounceCount.current >= 2) {
          bounceCount.current = 0
          if (ballRef.current) {
            const currentPos = ballRef.current.translation()
            ballRef.current.setBodyType(2)
            resetBallToInitialPosition(currentPos)
          }
        }
      }
    }
  }

  const handleSleep = () => {
    bounceCount.current = 0
    resetBallToInitialPosition()
  }

  useEffect(() => {
    if (isDragging) {
      setCursor("grabbing")
    }
  }, [isDragging])

  return (
    <RigidBody
      restitution={0.85}
      colliders="ball"
      ref={ballRef}
      type="fixed"
      position={[initialPosition.x, initialPosition.y, initialPosition.z]}
      onCollisionEnter={({ other }) => handleCollision(other)}
      onSleep={handleSleep}
      friction={0.8}
      linearDamping={0.5}
      angularDamping={0.5}
    >
      <mesh
        geometry={geometry}
        scale={1.7}
        material={material}
        rotation={[-Math.PI / 2.1, Math.PI / 2.1, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerEnter={() => !isDragging && setCursor("grab")}
        onPointerLeave={() => !isDragging && setCursor("default")}
        material-metalness={0}
        material-roughness={0.8}
      />
    </RigidBody>
  )
}
