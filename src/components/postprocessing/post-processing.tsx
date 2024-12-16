import { PerspectiveCamera } from "@react-three/drei"
import { useControls } from "leva"
import { useEffect, useRef } from "react"
import { ShaderMaterial, Texture, TextureLoader, Vector2 } from "three"
import * as THREE from "three"

import { useCameraStore } from "@/store/app-store"

import postFrag from "./post.frag"
import postVert from "./post.vert"

interface PostProcessingProps {
  mainTexture: Texture
}

const material = new ShaderMaterial({
  vertexShader: postVert,
  fragmentShader: postFrag,
  uniforms: {
    uMainTexture: { value: null },
    uEnableShader: { value: false },
    aspect: { value: 1 },
    screenSize: { value: new Vector2(1, 1) },
    dpr: { value: 1 },
    uPixelSize: { value: 1.0 },
    uColorNum: { value: 18.0 },
    uBayerSize: { value: 4 },
    uTolerance: { value: 0.25 },
    uBrightness: { value: 1.0 },
    uPreserveColors: { value: true },
    uDitherPattern: { value: 0 },
    uBrightnessThreshold: { value: 0.98 },
    uBayerTexture: { value: null },
    uBayer16Texture: { value: null },
    uBlueNoiseTexture: { value: null },

    // adjustments
    uContrast: { value: 1.0 },
    uExposure: { value: 1.0 },
    uGamma: { value: 1.0 }
  }
})

export function PostProcessing({ mainTexture }: PostProcessingProps) {
  const bayer8TextureRef = useRef<THREE.Texture | null>(null)
  const bayer16TextureRef = useRef<THREE.Texture | null>(null)
  const blueNoiseTextureRef = useRef<THREE.Texture | null>(null)

  const { pixelSize, bayerSize, enableShader } = useControls(
    "Post Processing",
    {
      enableShader: { value: true },
      pixelSize: { value: 1, min: 1.0, max: 32.0, step: 1.0 },
      bayerSize: {
        value: 16,
        options: {
          "8x8": 8,
          "16x16": 16,
          "blue noise": 999
        }
      },
      contrast: {
        value: 1.0,
        min: 0.0,
        max: 10.0,
        step: 0.01,
        onChange(value) {
          material.uniforms.uContrast.value = value
        }
      },
      exposure: {
        value: 1.16,
        min: 0.0,
        max: 10.0,
        step: 0.01,
        onChange(value) {
          material.uniforms.uExposure.value = value
        }
      },
      gamma: {
        value: 1.87,
        min: 0.0,
        max: 2.2,
        step: 0.01,
        onChange(value) {
          material.uniforms.uGamma.value = value
        }
      }
    }
  )

  useEffect(() => {
    const textureLoader = new TextureLoader()
    const bayerTexture = textureLoader.load("/textures/bayer8x8.png")
    bayerTexture.minFilter = THREE.NearestFilter
    bayerTexture.magFilter = THREE.NearestFilter
    bayer8TextureRef.current = bayerTexture

    const blueNoiseTexture = textureLoader.load("/textures/bluenoise.png")
    blueNoiseTexture.wrapS = THREE.RepeatWrapping
    blueNoiseTexture.wrapT = THREE.RepeatWrapping
    blueNoiseTextureRef.current = blueNoiseTexture

    const bayer16Texture = textureLoader.load("/textures/bayer16x16.png")
    bayer16Texture.minFilter = THREE.NearestFilter
    bayer16Texture.magFilter = THREE.NearestFilter
    bayer16TextureRef.current = bayer16Texture

    return () => {
      if (
        bayer8TextureRef.current &&
        blueNoiseTextureRef.current &&
        bayer16TextureRef.current
      ) {
        bayer8TextureRef.current.dispose()
        blueNoiseTextureRef.current.dispose()
        bayer16TextureRef.current.dispose()
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = window.devicePixelRatio
      material.uniforms.screenSize.value.set(width, height)
      material.uniforms.dpr.value = dpr
      material.uniforms.aspect.value = width / height
    }

    resize()
    window.addEventListener("resize", resize, { signal })

    material.uniforms.uMainTexture.value = mainTexture
    material.uniforms.uEnableShader.value = enableShader
    material.uniforms.uPixelSize.value = pixelSize
    material.uniforms.uBayerSize.value = bayerSize
    material.uniforms.uBayerTexture.value = bayer8TextureRef.current
    material.uniforms.uBlueNoiseTexture.value = blueNoiseTextureRef.current
    material.uniforms.uBayer16Texture.value = bayer16TextureRef.current

    return () => {
      controller.abort()
    }
  }, [mainTexture, enableShader, pixelSize, bayerSize])

  const calculateFov = (z: number) => {
    return Math.atan(1 / z) * (180 / Math.PI)
  }

  return (
    <>
      <PerspectiveCamera
        manual
        position={[0, 0, 10]}
        aspect={1}
        fov={calculateFov(10)}
        ref={(r) => {
          if (r) useCameraStore.setState({ postProcessingCamera: r })
        }}
      />
      <mesh>
        <planeGeometry args={[1, 1]} />
        <primitive object={material} attach="material" />
      </mesh>
    </>
  )
}
