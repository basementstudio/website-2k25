import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { RefObject, useEffect, useMemo, useRef } from "react"
import { Mesh, MeshBasicMaterial, MeshStandardMaterial } from "three"

import { useSiteAudio } from "@/hooks/use-site-audio"

import { useAssets } from "../assets-provider"
import { useMouseStore } from "../mouse-tracker/mouse-tracker"

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

  const { basketball } = useAssets()
  const basketballModel = useGLTF(basketball)
  const bounceCount = useRef(0)

  const geometry = useMemo(
    () => (basketballModel.scene.children[0] as Mesh).geometry,
    [basketballModel]
  )

  const material = useMemo(() => {
    const originalMaterial = basketballModel.materials[
      "Material.001"
    ] as MeshStandardMaterial
    return new MeshBasicMaterial({
      map: originalMaterial.map
    })
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

  const setCursorType = useMouseStore((state) => state.setCursorType)

  useEffect(() => {
    if (isDragging) {
      setCursorType("grabbing")
    }
  }, [isDragging, setCursorType])

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
        material={material}
        scale={1.7}
        rotation={[-Math.PI / 2.1, Math.PI / 2.1, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerEnter={() => !isDragging && setCursorType("grab")}
        onPointerLeave={() => !isDragging && setCursorType("default")}
        material-metalness={0}
        material-roughness={0.8}
      />
    </RigidBody>
  )
}
