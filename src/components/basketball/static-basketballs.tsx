import { useGLTF } from "@react-three/drei"
import { useEffect, useMemo } from "react"
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

  const material = useMemo(() => {
    const mat = createGlobalShaderMaterial(originalMaterial.clone(), false)
    mat.uniforms.uLoaded.value = 1
    return mat
  }, [originalMaterial])

  useEffect(() => {
    if (!playedBallMaterial) {
      // Create a clone of the original material to avoid modifying the shared instance
      const clonedMaterial = originalMaterial.clone()

      // Create a new global shader material
      const material = createGlobalShaderMaterial(clonedMaterial, false)

      // Skip the preload animation by setting uLoaded to 1
      material.uniforms.uLoaded.value = 1

      // Set the played ball material in the store
      setPlayedBallMaterial(material)
    }
  }, [originalMaterial, playedBallMaterial, setPlayedBallMaterial])

  if (!playedBallMaterial) return null

  return (
    <>
      {staticBalls.map((ball, index) => (
        <mesh
          raycast={() => null}
          key={index}
          geometry={geometry}
          material={material}
          position={[ball.position.x, ball.position.y, ball.position.z]}
          rotation={[ball.rotation.x, ball.rotation.y, ball.rotation.z]}
          scale={1.7}
          userData={{ hasGlobalMaterial: true }}
        />
      ))}
    </>
  )
}

export default StaticBasketballs
