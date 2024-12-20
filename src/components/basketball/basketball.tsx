import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { RefObject, useMemo } from "react"
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

  const geometry = useMemo(
    () => (basketballModel.scene.children[0] as Mesh).geometry,
    [basketballModel]
  )

  console.log(basketballModel)

  return (
    <RigidBody
      restitution={0.85}
      colliders="ball"
      ref={ballRef}
      type="fixed"
      position={[initialPosition.x, initialPosition.y, initialPosition.z]}
      onCollisionEnter={({ other }) => {
        if (!isDragging) {
          if (other.rigidBodyObject?.name === "floor") {
            const bounceCount = (ballRef.current as any)?.bounceCount || 0
            ;(ballRef.current as any).bounceCount = bounceCount + 1

            if ((ballRef.current as any).bounceCount >= 2) {
              resetBallToInitialPosition()
            }
          }
        }
      }}
      onSleep={resetBallToInitialPosition}
    >
      {/* Mass does not change the weight of the object, it changes 
      how it reacts when it collides with an object with a different mass. 
      An additional mesh in this body can duplicate the weight of the basketball 
      which may make it easier to score points. */}

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
