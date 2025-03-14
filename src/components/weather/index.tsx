import { useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo } from "react"
import {
  Color,
  Matrix3,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  Texture,
  Vector3
} from "three"

import { useMesh } from "@/hooks/use-mesh"
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
      transparent: true
    })
    // cerate materialClose
    const rainMaterialClose = createGlobalShaderMaterial(
      baseMaterial as any,
      false
    )

    rainMaterialClose.uniforms.mapMatrix.value = closeMatrix

    // create materialFar
    const rainMaterialFar = createGlobalShaderMaterial(
      baseMaterial as any,
      false
    )
    farMatrix.multiplyScalar(4)
    // rainMaterialFar.uniforms.mapMatrix.value = farMatrix

    return [rainMaterialClose, rainMaterialFar]
  }, [rainAlphaTexture, closeMatrix, farMatrix])

  const { loboMarino, rain } = useMesh((s) => s.weather)

  if (rain) {
    rain.visible = false
  }

  useFrame(({ clock }, delta) => {
    const matClose = rainMaterialClose.uniforms.alphaMapTransform
      .value as Matrix3
    // matClose.makeTranslation(0, clock.getElapsedTime() * 2)

    const closeRepeat = 100
    matClose.setUvTransform(
      0,
      clock.getElapsedTime() * 2,
      closeRepeat,
      closeRepeat,
      0,
      0,
      0
    )

    // const matFar = rainMaterialFar.uniforms.alphaMapTransform.value as Matrix3
    // matFar.makeTranslation(0, clock.getElapsedTime() * 4)
  })

  return (
    <>
      <mesh position={[3, 3, -4]} rotation-y={Math.PI} rotation-z={-0.1}>
        <planeGeometry args={[6, 6]} />
        <primitive object={rainMaterialClose} attach="material" />
      </mesh>
      {/* <mesh position={[0, 5, 2]} rotation-y={Math.PI} rotation-z={-0.1}>
        <planeGeometry args={[10, 10]} />
        <primitive object={rainMaterialFar} attach="material" />
      </mesh> */}
    </>
  )
}
