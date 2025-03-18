import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { RefObject, useEffect, useMemo, useRef } from "react"
import { Mesh, MeshStandardMaterial, Vector3 } from "three"

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
  isTimerEnding?: boolean
  isTimerLow?: boolean
}

export const Basketball = ({
  ballRef,
  initialPosition,
  isDragging,
  resetBallToInitialPosition,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isTimerEnding = false,
  isTimerLow = false
}: BasketballProps) => {
  const { playSoundFX } = useSiteAudio()
  const setCursor = useCursor()
  const { basketball } = useAssets()
  const basketballModel = useGLTF(basketball)
  const bounceCount = useRef(0)

  const geometry = useMemo(() => {
    const geo = (basketballModel.scene.children[0] as Mesh).geometry
    return geo
  }, [basketballModel])

  const originalMaterial = basketballModel.materials[
    "Material.002"
  ] as MeshStandardMaterial

  const material = useMemo(() => {
    const mat = createGlobalShaderMaterial(originalMaterial.clone(), false, {
      LIGHT: true
    })
    mat.uniforms.lightDirection.value = new Vector3(0, 0, 1)
    return mat
  }, [originalMaterial])

  const handleCollision = (other: any) => {
    const randomVolume = 0.05 + Math.random() * 0.05
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

        if (bounceCount.current >= 1) {
          bounceCount.current = 0
          if (ballRef.current && !isTimerLow && !isTimerEnding) {
            const ball = ballRef.current
            const translation = ball.translation()
            const currentPos = {
              x: translation.x,
              y: translation.y,
              z: translation.z
            }
            ball.setBodyType(2)
            resetBallToInitialPosition(currentPos)
          }
        }
      }
    }
  }

  const handleSleep = () => {
    if (!isDragging && !isTimerEnding && !isTimerLow) {
      bounceCount.current = 0
      resetBallToInitialPosition()
    }
  }

  useEffect(() => {
    if (isDragging) {
      setCursor("grabbing")
    } else {
      setCursor("default")
    }

    return () => {
      setCursor("default")
    }
  }, [isDragging, setCursor])

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
        scale={1.25}
        geometry={geometry}
        material={material}
        rotation={[-Math.PI / 2.1, Math.PI / 2.1, 0]}
        onPointerDown={isTimerLow ? undefined : handlePointerDown}
        onPointerMove={isTimerLow ? undefined : handlePointerMove}
        onPointerUp={isTimerLow ? undefined : handlePointerUp}
        onPointerEnter={() => !isDragging && !isTimerLow && setCursor("grab")}
        onPointerLeave={() => !isDragging && setCursor("default")}
        userData={{ hasGlobalMaterial: true }}
      />
    </RigidBody>
  )
}
