import { OrthographicCamera } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
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
import { usePostprocessingSettings } from "./use-postprocessing-settings"

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
    uTime: { value: 0.0 },

    // Basics
    uContrast: { value: 1 },
    uBrightness: { value: 1 },
    uExposure: { value: 1 },
    uGamma: { value: 1 },
    u404Transition: { value: 0.0 },

    // Vignette
    uVignetteRadius: { value: 0.9 },
    uVignetteSpread: { value: 0.5 },

    // Bloom
    uBloomStrength: { value: 1 },
    uBloomRadius: { value: 1 },
    uBloomThreshold: { value: 1 }
  }
})

export function PostProcessing({
  mainTexture,
  cameraRef
}: PostProcessingProps) {
  const scene = useCurrentScene()
  const assets = useAssets()
  const firstRender = useRef(true)

  const {
    basics,
    bloom,
    vignette,
    setBasics,
    setBloom,
    setVignette,
    hasChanged
  } = usePostprocessingSettings()

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
    const config = !firstRender.current ? ANIMATION_CONFIG : { duration: 0 }

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

      setBasics({
        contrast: p.contrast,
        brightness: p.brightness,
        exposure: p.exposure,
        gamma: p.gamma
      })

      setBloom({
        strength: p.bloomStrength,
        radius: p.bloomRadius,
        threshold: p.bloomThreshold
      })

      setVignette({
        radius: p.vignetteRadius,
        spread: p.vignetteSpread
      })

      hasChanged.current = false

      firstRender.current = false
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])

  useFrame(() => {
    if (!hasChanged.current) {
      material.uniforms.uContrast.value = targets.contrast.get()
      material.uniforms.uBrightness.value = targets.brightness.get()
      material.uniforms.uExposure.value = targets.exposure.get()
      material.uniforms.uGamma.value = targets.gamma.get()
      material.uniforms.uVignetteRadius.value = targets.vignetteRadius.get()
      material.uniforms.uVignetteSpread.value = targets.vignetteSpread.get()
      material.uniforms.uBloomStrength.value = targets.bloomStrength.get()
      material.uniforms.uBloomRadius.value = targets.bloomRadius.get()
      material.uniforms.uBloomThreshold.value = targets.bloomThreshold.get()
    } else {
      material.uniforms.uContrast.value = basics.contrast
      material.uniforms.uBrightness.value = basics.brightness
      material.uniforms.uExposure.value = basics.exposure
      material.uniforms.uGamma.value = basics.gamma
      material.uniforms.uVignetteRadius.value = vignette.radius
      material.uniforms.uVignetteSpread.value = vignette.spread
      material.uniforms.uBloomStrength.value = bloom.strength
      material.uniforms.uBloomRadius.value = bloom.radius
      material.uniforms.uBloomThreshold.value = bloom.threshold
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
    const is404 = scene === "404"
    const start404Value = material.uniforms.u404Transition.value
    const end404Value = is404 ? 1.0 : 0.0

    material.defines = {
      ...(material.defines || {}),
      IS_404_SCENE: is404
    }
    material.needsUpdate = true

    const duration = 700
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

      material.uniforms.u404Transition.value =
        start404Value + (end404Value - start404Value) * easeProgress

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [scene])

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime
  })

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
