import { useTexture } from "@react-three/drei"
import { animate, useMotionValue } from "motion/react"
import { useEffect, useMemo, useRef } from "react"
import {
  Color,
  Group,
  Matrix3,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  ShaderMaterial,
  Vector3
} from "three"

import { useAssets } from "@/components/assets-provider"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { createGlobalShaderMaterial } from "@/shaders/material-global-shader"

import { toggleRainOverride, useWeather } from "./weather-store"

export { useWeather } from "./weather-store"

export const Weather = () => {
  const {
    mapTextures: { rain: rainTexture }
  } = useAssets()

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

  const rainGroupRef = useRef<Group>(null)
  const isRaining = useWeather((s) => s.isRaining)
  const rainIntensity = useWeather((s) => s.rainIntensity)
  const rainAlpha = useMotionValue(isRaining ? rainIntensity : 0)

  useEffect(() => {
    const target = isRaining ? rainIntensity : 0
    if (target > 0 && rainGroupRef.current) rainGroupRef.current.visible = true

    const animation = animate(rainAlpha, target, {
      duration: 1,
      ease: "easeInOut",
      onUpdate: (v) => {
        rainMaterialClose.uniforms.opacity.value = v
        rainMaterialFar.uniforms.opacity.value = v
      },
      onComplete: () => {
        // Fully faded curtains would still rasterize three large transparent
        // quads every frame — drop them from the draw list instead.
        if (target === 0 && rainGroupRef.current)
          rainGroupRef.current.visible = false
      }
    })

    return () => animation.stop()
  }, [isRaining, rainIntensity, rainMaterialClose, rainMaterialFar, rainAlpha])

  useFrameCallback((_, delta, elapsedTime) => {
    if (!rainGroupRef.current?.visible) return

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
      <group ref={rainGroupRef} visible={isRaining}>
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
      </group>
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
        toggleRainOverride()
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
