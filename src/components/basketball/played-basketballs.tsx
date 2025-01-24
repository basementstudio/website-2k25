import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { useMemo } from "react"
import { Mesh } from "three"

import { useMinigameStore } from "@/store/minigame-store"

import { useAssets } from "../assets-provider"

export const PlayedBasketballs = () => {
  const { basketball } = useAssets()
  const basketballModel = useGLTF(basketball)
  const playedBalls = useMinigameStore((state) => state.playedBalls)

  const geometry = useMemo(
    () => (basketballModel.scene.children[0] as Mesh).geometry,
    [basketballModel]
  )

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
        >
          <mesh
            geometry={geometry}
            material={basketballModel.materials["Material.001"]}
            raycast={() => null}
            scale={1.7}
            material-metalness={0}
            material-roughness={0.8}
          />
        </RigidBody>
      ))}
    </>
  )
}
