import { useTexture } from "@react-three/drei"
import { animate, useMotionValue } from "motion/react"
import { useEffect, useMemo } from "react"
import {
  Color,
  Matrix3,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  ShaderMaterial,
  Vector3
} from "three"
import { create } from "zustand"

import { useAssets } from "@/components/assets-provider/use-assets"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { createGlobalShaderMaterial } from "@/shaders/material-global-shader"

export const useWeather = create<{
  isRaining: boolean
}>(() => ({
  isRaining: Math.random() > 0.5
}))

export const Weather = () => {
  const assets = useAssets()
  const rainTexture = assets?.mapTextures?.rain ?? ""

  const rainAlphaTexture = useTexture(rainTexture)

  const closeMatrix = useMemo(() => new Matrix3().identity(), [])
  const farMatrix = useMemo(() => new Matrix3().identity(), [])

  const loboMarino = useMesh((s) => s.weather.loboMarino)

  const [rainMaterialClose, rainMaterialFar] = useMemo(() => {
    rainAlphaTexture.wrapS = rainAlphaTexture.wrapT = RepeatWrapping

    const baseMaterial = new MeshStandardMaterial({
      color: new Color("white"),
      alphaMap: rainAlphaTexture,
      opacity: 0.5,
      transparent: true
    })

    // create materialClose
    const rainMaterialClose = createGlobalShaderMaterial(baseMaterial as any)

    rainMaterialClose.uniforms.mapMatrix.value = closeMatrix

    // create materialFar
    const rainMaterialFar = createGlobalShaderMaterial(baseMaterial as any)
    farMatrix.multiplyScalar(4)
    rainMaterialFar.uniforms.mapMatrix.value = farMatrix

    return [rainMaterialClose, rainMaterialFar]
  }, [rainAlphaTexture, closeMatrix, farMatrix])

  const { rain } = useMesh((s) => s.weather)

  if (rain) {
    rain.visible = false
  }

  const isRaining = useWeather((s) => s.isRaining)
  const rainAlpha = useMotionValue(isRaining ? 1 : 0)

  useEffect(() => {
    const animation = animate(rainAlpha, isRaining ? 1 : 0, {
      duration: 1,
      ease: "easeInOut",
      onUpdate: (v) => {
        rainMaterialClose.uniforms.opacity.value = v
        rainMaterialFar.uniforms.opacity.value = v
      }
    })

    return () => animation.stop()
  }, [isRaining, rainMaterialClose, rainMaterialFar, rainAlpha])

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
        <planeGeometry args={[6, 7]} />
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
      {loboMarino && <LoboMarino loboMarino={loboMarino} />}
    </>
  )
}

const rainLoboColor = new Vector3().fromArray(new Color("#853ea1").toArray())
const dayLoboColor = new Vector3().fromArray(new Color("#4b5091").toArray())

function LoboMarino({ loboMarino }: { loboMarino: Mesh }) {
  const isRaining = useWeather((s) => s.isRaining)

  const currentLoboColor = useMemo(
    () => (isRaining ? rainLoboColor.clone() : dayLoboColor.clone()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useFrameCallback((_, delta) => {
    currentLoboColor.lerp(isRaining ? rainLoboColor : dayLoboColor, delta)
  })

  const loboMaterial = useMemo(() => {
    const mat = loboMarino?.material as ShaderMaterial
    mat.uniforms.uColor.value = currentLoboColor

    mat.defines.IS_LOBO_MARINO = true
    mat.needsUpdate = true

    return mat
  }, [loboMarino, currentLoboColor])

  const setCursor = useCursor()

  return (
    <mesh
      onClick={() => {
        useWeather.setState({ isRaining: !isRaining })
      }}
      onPointerEnter={() => {
        setCursor("pointer")
      }}
      onPointerLeave={() => {
        setCursor("default")
      }}
      position={loboMarino?.position}
      geometry={loboMarino?.geometry}
      rotation={loboMarino?.rotation}
      scale={loboMarino?.scale}
    >
      <primitive object={loboMaterial} attach="material" />
    </mesh>
  )
}
