import { OrthographicCamera } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { folder as levaFolder, useControls } from "leva"
import { animate, MotionValue } from "motion"
import { useEffect, useMemo, useRef } from "react"
import {
  OrthographicCamera as ThreeOrthographicCamera,
  ShaderMaterial,
  Texture,
  Vector2
} from "three"

import { useAssets } from "@/components/assets-provider"
import { ANIMATION_CONFIG } from "@/constants/inspectables"
import { useCurrentScene } from "@/hooks/use-current-scene"

import postFrag from "./post.frag"
import postVert from "./post.vert"

interface PostProcessingProps {
  mainTexture: Texture
  cameraRef: React.RefObject<ThreeOrthographicCamera | null>
}

const material = new ShaderMaterial({
  vertexShader: postVert,
  fragmentShader: postFrag,
  uniforms: {
    uMainTexture: { value: null },
    aspect: { value: 1 },
    resolution: { value: new Vector2(1, 1) },
    uPixelRatio: { value: 1 },

    // Basics
    uContrast: { value: 1 },
    uBrightness: { value: 1 },
    uExposure: { value: 1 },
    uGamma: { value: 1 },

    // bloom
    uBloomStrength: { value: 1 },
    uBloomRadius: { value: 1 },
    uBloomThreshold: { value: 1 },

    // Vignette
    uVignetteRadius: { value: 0.9 },
    uVignetteSpread: { value: 0.5 },

    // Others
    uSaturation: { value: 1.0 },
    uEllipseCenter: { value: new Vector2(0.5, 0.61) },
    uEllipseSize: { value: new Vector2(0.13, 0.09) },
    uEllipseSoftness: { value: 0.78 },
    uDebugEllipse: { value: false },
    uVignetteStrength: { value: 1.0 },
    uVignetteSoftness: { value: 0.18 }
  }
})

export function PostProcessing({
  mainTexture,
  cameraRef
}: PostProcessingProps) {
  const scene = useCurrentScene()
  const assets = useAssets()
  const firstRender = useRef(true)

  const targets = useMemo(
    () => ({
      contrast: new MotionValue(),
      brightness: new MotionValue(),
      exposure: new MotionValue(),
      gamma: new MotionValue(),
      vignetteRadius: new MotionValue(),
      vignetteSpread: new MotionValue(),
      bloomStrength: new MotionValue(),
      bloomRadius: new MotionValue(),
      bloomThreshold: new MotionValue()
    }),
    []
  )

  useEffect(() => {
    const config = firstRender.current ? ANIMATION_CONFIG : { duration: 0 }

    const p = assets.scenes.find((s) => s.name === scene)?.postprocessing

    if (p) {
      animate(targets.contrast, p.contrast, config)
      animate(targets.brightness, p.brightness, config)
      animate(targets.exposure, p.exposure, config)
      animate(targets.gamma, p.gamma, config)
      animate(targets.vignetteRadius, p.vignetteRadius, config)
      animate(targets.vignetteSpread, p.vignetteSpread, config)
      animate(targets.bloomStrength, p.bloomStrength, config)
      animate(targets.bloomRadius, p.bloomRadius, config)
      animate(targets.bloomThreshold, p.bloomThreshold, config)

      firstRender.current = false
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])

  useFrame(() => {
    material.uniforms.uContrast.value = targets.contrast.get()
    material.uniforms.uBrightness.value = targets.brightness.get()
    material.uniforms.uExposure.value = targets.exposure.get()
    material.uniforms.uGamma.value = targets.gamma.get()
    material.uniforms.uVignetteRadius.value = targets.vignetteRadius.get()
    material.uniforms.uVignetteSpread.value = targets.vignetteSpread.get()
    material.uniforms.uBloomStrength.value = targets.bloomStrength.get()
    material.uniforms.uBloomRadius.value = targets.bloomRadius.get()
    material.uniforms.uBloomThreshold.value = targets.bloomThreshold.get()
  })

  useControls({
    "saturation mask": levaFolder(
      {
        debugEllipse: {
          value: false,
          onChange(value) {
            material.uniforms.uDebugEllipse.value = value
          }
        },
        ellipseCenterX: {
          value: 0.5,
          min: 0,
          max: 1,
          step: 0.01,
          onChange(value) {
            material.uniforms.uEllipseCenter.value.x = value
          }
        },
        ellipseCenterY: {
          value: 0.61,
          min: 0,
          max: 1,
          step: 0.01,
          onChange(value) {
            material.uniforms.uEllipseCenter.value.y = value
          }
        },
        ellipseSizeX: {
          value: 0.13,
          min: 0,
          max: 2,
          step: 0.01,
          onChange(value) {
            material.uniforms.uEllipseSize.value.x = value
          }
        },
        ellipseSizeY: {
          value: 0.09,
          min: 0,
          max: 2,
          step: 0.01,
          onChange(value) {
            material.uniforms.uEllipseSize.value.y = value
          }
        },
        ellipseSoftness: {
          value: 0.78,
          min: 0,
          max: 1,
          step: 0.01,
          onChange(value) {
            material.uniforms.uEllipseSoftness.value = value
          }
        },
        vignetteStrength: {
          value: 1.0,
          min: 0,
          max: 1,
          step: 0.01,
          onChange(value) {
            material.uniforms.uVignetteStrength.value = value
          }
        },
        vignetteSoftness: {
          value: 0.18,
          min: 0,
          max: 2,
          step: 0.01,
          onChange(value) {
            material.uniforms.uVignetteSoftness.value = value
          }
        }
      },
      {
        collapsed: true
      }
    )
  })

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      material.uniforms.resolution.value.set(width, height)
      material.uniforms.uPixelRatio.value = window.devicePixelRatio
    }

    resize()
    window.addEventListener("resize", resize, { signal })

    material.uniforms.uMainTexture.value = mainTexture

    return () => controller.abort()
  }, [mainTexture])

  useEffect(() => {
    const isBasketball = scene === "basketball"
    const startSaturationValue = material.uniforms.uSaturation.value
    const endSaturationValue = isBasketball ? 0.0 : 1.0
    const startVignetteValue = material.uniforms.uVignetteStrength.value
    const endVignetteValue = isBasketball ? 1.0 : 0.0
    const duration = 800

    const startTime = performance.now()
    let animationFrame: number

    const animate = () => {
      const currentTime = performance.now()
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeProgress =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress

      material.uniforms.uSaturation.value =
        startSaturationValue +
        (endSaturationValue - startSaturationValue) * easeProgress

      material.uniforms.uVignetteStrength.value =
        startVignetteValue +
        (endVignetteValue - startVignetteValue) * easeProgress

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [scene])

  return (
    <>
      <OrthographicCamera
        manual
        ref={cameraRef}
        position={[0, 0, 1]}
        left={-0.5}
        right={0.5}
        top={0.5}
        bottom={-0.5}
        near={0.1}
        far={1000}
      />
      <mesh>
        <planeGeometry args={[1, 1]} />
        <primitive object={material} attach="material" />
      </mesh>
    </>
  )
}
