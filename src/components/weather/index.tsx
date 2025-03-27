import { useTexture } from "@react-three/drei"
import { useMemo } from "react"
import { Color, Matrix3, MeshStandardMaterial, RepeatWrapping } from "three"

import { useMesh } from "@/hooks/use-mesh"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { createGlobalShaderMaterial } from "@/shaders/material-global-shader"

import { useAssets } from "../assets-provider"

export function Weather() {
  const {
    mapTextures: { rain: rainTexture }
  } = useAssets()

  const rainAlphaTexture = useTexture(rainTexture)

  const closeMatrix = useMemo(() => new Matrix3().identity(), [])
  const farMatrix = useMemo(() => new Matrix3().identity(), [])

  const [rainMaterialClose, rainMaterialFar] = useMemo(() => {
    rainAlphaTexture.wrapS = rainAlphaTexture.wrapT = RepeatWrapping

    const baseMaterial = new MeshStandardMaterial({
      color: new Color("white"),
      alphaMap: rainAlphaTexture,
      opacity: 0.5,
      transparent: true
    })
    // cerate materialClose
    const rainMaterialClose = createGlobalShaderMaterial(baseMaterial as any)

    rainMaterialClose.uniforms.mapMatrix.value = closeMatrix

    // create materialFar
    const rainMaterialFar = createGlobalShaderMaterial(baseMaterial as any)
    farMatrix.multiplyScalar(4)
    rainMaterialFar.uniforms.mapMatrix.value = farMatrix

    return [rainMaterialClose, rainMaterialFar]
  }, [rainAlphaTexture, closeMatrix, farMatrix])

  const { loboMarino, rain } = useMesh((s) => s.weather)

  if (rain) {
    rain.visible = false
  }

  useFrameCallback((_, delta, elapsedTime) => {
    const matClose = rainMaterialClose.uniforms.alphaMapTransform
      .value as Matrix3

    const closeRepeat = 2
    const closeOffsetY = elapsedTime * 1.5
    matClose.setUvTransform(0, closeOffsetY, closeRepeat, closeRepeat, 0, 0, 0)

    const matFar = rainMaterialFar.uniforms.alphaMapTransform.value as Matrix3

    const farRepeat = 4
    const farOffsetY = elapsedTime * 3
    matFar.setUvTransform(0, farOffsetY, farRepeat, farRepeat, 0, 0, 0)
  })

  return (
    <>
      <mesh position={[3, 3, -2]} rotation-y={Math.PI} rotation-z={-0.15}>
        <planeGeometry args={[6, 6]} />
        <primitive object={rainMaterialClose} attach="material" />
      </mesh>
      <mesh position={[0, 5, 2]} rotation-y={Math.PI} rotation-z={-0.15}>
        <planeGeometry args={[10, 10]} />
        <primitive object={rainMaterialFar} attach="material" />
      </mesh>
      <mesh position={[1, 5, 5]} rotation-y={Math.PI} rotation-z={-0.15}>
        <planeGeometry args={[10, 10]} />
        <primitive object={rainMaterialFar} attach="material" />
      </mesh>
    </>
  )
}
