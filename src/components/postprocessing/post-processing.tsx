import { OrthographicCamera } from "@react-three/drei"
import { useControls } from "leva"
import { useEffect } from "react"
import {
  OrthographicCamera as ThreeOrthographicCamera,
  ShaderMaterial,
  Texture,
  Vector2
} from "three"

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
    uEnableShader: { value: false },
    aspect: { value: 1 },
    resolution: { value: new Vector2(1, 1) },
    uPixelRatio: { value: 1 },
    uPalette: { value: null },
    uBias: { value: 0.0 },
    uColorMultiplier: { value: 1.0 },
    uNoiseFactor: { value: 0.0 },
    uBloomStrength: { value: 0.9 },
    uBloomRadius: { value: 10 },
    uBloomThreshold: { value: 1.5 },

    // adjustments
    uContrast: { value: 1 },
    uExposure: { value: 1.2 },
    uGamma: { value: 2.2 },
    uBrightness: { value: 1 },
    uSaturation: { value: 1.0 },
    uEllipseCenter: { value: new Vector2(0.5, 0.61) },
    uEllipseSize: { value: new Vector2(0.13, 0.09) },
    uEllipseSoftness: { value: 0.78 },
    uDebugEllipse: { value: false },
    uVignetteStrength: { value: 1.0 },
    uVignetteSoftness: { value: 0.18 },
    uIs404: { value: false }
  }
})

export function PostProcessing({
  mainTexture,
  cameraRef
}: PostProcessingProps) {
  const scene = useCurrentScene()

  useControls("basics", {
    contrast: {
      value: 1.02,
      min: 0.0,
      max: 2.0,
      step: 0.01,
      onChange(value) {
        material.uniforms.uContrast.value = value
      }
    },
    brightness: {
      value: 0.31,
      min: 0.0,
      max: 2.0,
      step: 0.01,
      onChange(value) {
        material.uniforms.uBrightness.value = value
      }
    },
    exposure: {
      value: 0.54,
      min: 0.0,
      max: 4.0,
      step: 0.01,
      onChange(value) {
        material.uniforms.uExposure.value = value
      }
    },
    gamma: {
      value: 0.73,
      min: 0.0,
      max: 2.2,
      step: 0.01,
      onChange(value) {
        material.uniforms.uGamma.value = value
      }
    }
  })

  useControls("bloom", {
    bloomThreshold: {
      value: 1,
      min: 0.0,
      max: 10.0,
      step: 0.01,
      onChange(value) {
        material.uniforms.uBloomThreshold.value = value
      }
    },
    bloomStrength: {
      value: 0.15,
      min: 0.0,
      max: 2.0,
      step: 0.01,
      onChange(value) {
        material.uniforms.uBloomStrength.value = value
      }
    },
    bloomRadius: {
      value: 5.0,
      min: 1.0,
      max: 64.0,
      step: 1,
      onChange(value) {
        material.uniforms.uBloomRadius.value = value
      }
    }
  })

  useControls("saturation mask", {
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
    const is404 = scene === "404"
    const startSaturationValue = material.uniforms.uSaturation.value
    const endSaturationValue = isBasketball ? 0.0 : 1.0
    const startVignetteValue = material.uniforms.uVignetteStrength.value
    const endVignetteValue = isBasketball ? 1.0 : 0.0

    // Update the shader defines
    material.defines = {
      ...(material.defines || {}),
      IS_404_SCENE: is404
    }
    material.needsUpdate = true

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
