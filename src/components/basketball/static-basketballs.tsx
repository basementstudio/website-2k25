import { useGLTF } from "@react-three/drei"
import { useMemo } from "react"
import { Mesh, MeshStandardMaterial } from "three"

import { createGlobalShaderMaterial } from "@/shaders/material-global-shader"
import { useMinigameStore } from "@/store/minigame-store"

import { useAssets } from "../assets-provider"

const StaticBasketballs = () => {
  const { basketball } = useAssets()
  const basketballModel = useGLTF(basketball)
  const staticBalls = useMinigameStore((state) => state.staticBalls)
  const playedBallMaterial = useMinigameStore(
    (state) => state.playedBallMaterial
  )
  const setPlayedBallMaterial = useMinigameStore(
    (state) => state.setPlayedBallMaterial
  )

  const geometry = useMemo(
    () => (basketballModel.scene.children[0] as Mesh).geometry,
    [basketballModel]
  )

  const originalMaterial = basketballModel.materials[
    "Material.001"
  ] as MeshStandardMaterial

  if (!playedBallMaterial) {
    const material = createGlobalShaderMaterial(originalMaterial, true)
    setPlayedBallMaterial(material)
    return null
  }

  return (
    <>
      {staticBalls.map((ball, index) => (
        <mesh
          key={index}
          geometry={geometry}
          material={originalMaterial}
          position={[ball.position.x, ball.position.y, ball.position.z]}
          rotation={[ball.rotation.x, ball.rotation.y, ball.rotation.z]}
          scale={1.7}
          material-metalness={0}
          material-roughness={0.8}
        />
      ))}
    </>
  )
}

export default StaticBasketballs
