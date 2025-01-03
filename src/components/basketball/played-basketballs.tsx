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
      {playedBalls.map((position, index) => (
        <RigidBody
          key={index}
          restitution={0.85}
          colliders="ball"
          type="dynamic"
          position={[position.x, position.y, position.z]}
        >
          <mesh
            geometry={geometry}
            material={basketballModel.materials["Material.001"]}
            scale={1.7}
            material-metalness={0}
            material-roughness={0.8}
          />
        </RigidBody>
      ))}
    </>
  )
}
