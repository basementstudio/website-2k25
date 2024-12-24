import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { RefObject, useMemo, useRef } from "react"
import { Mesh } from "three"

import { useAssets } from "../assets-provider"

interface BasketballProps {
  ballRef: RefObject<any>
  initialPosition: { x: number; y: number; z: number }
  isDragging: boolean
  hoopPosition: { x: number; y: number; z: number }
  resetBallToInitialPosition: () => void
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
  const { basketball } = useAssets()
  const basketballModel = useGLTF(basketball)
  const bounceCount = useRef(0)

  const geometry = useMemo(
    () => (basketballModel.scene.children[0] as Mesh).geometry,
    [basketballModel]
  )

  const handleCollision = (other: any) => {
    if (!isDragging) {
      if (other.rigidBodyObject?.name === "floor") {
        bounceCount.current += 1

        if (bounceCount.current >= 2) {
          bounceCount.current = 0
          resetBallToInitialPosition()
        }
      }
    }
  }

  const handleSleep = () => {
    bounceCount.current = 0
    resetBallToInitialPosition()
  }

  return (
    <RigidBody
      restitution={0.85}
      colliders="ball"
      ref={ballRef}
      type="fixed"
      position={[initialPosition.x, initialPosition.y, initialPosition.z]}
      onCollisionEnter={({ other }) => handleCollision(other)}
      onSleep={handleSleep}
    >
      <mesh
        geometry={geometry}
        material={basketballModel.materials["Material.001"]}
        scale={1.7}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        material-metalness={0}
        material-roughness={0.8}
      />
    </RigidBody>
  )
}
