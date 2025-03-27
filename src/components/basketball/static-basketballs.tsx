import { useEffect, useMemo } from "react"
import { Mesh, MeshStandardMaterial, Vector3 } from "three"

import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"
import { createGlobalShaderMaterial } from "@/shaders/material-global-shader"
import { useMinigameStore } from "@/store/minigame-store"

import { useAssets } from "../assets-provider"
const StaticBasketballs = () => {
  const { basketball } = useAssets()
  const basketballModel = useKTX2GLTF(basketball)
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

  const originalMaterial = useMemo(() => {
    let material: MeshStandardMaterial | undefined
    basketballModel.scene.traverse((node) => {
      if (node instanceof Mesh && node.material) {
        if (
          node.material.name === "Material.002" ||
          node.material instanceof MeshStandardMaterial
        ) {
          material = node.material as MeshStandardMaterial
        }
      }
    })
    return material as MeshStandardMaterial
  }, [basketballModel])

  const material = useMemo(() => {
    const mat = createGlobalShaderMaterial(originalMaterial.clone(), {
      LIGHT: true
    })
    mat.uniforms.lightDirection.value = new Vector3(0, 0, 1)
    return mat
  }, [originalMaterial])

  useEffect(() => {
    if (!playedBallMaterial) {
      const clonedMaterial = originalMaterial.clone()
      const material = createGlobalShaderMaterial(clonedMaterial, {
        LIGHT: true
      })
      material.uniforms.lightDirection.value = new Vector3(0, 0, 1)
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
