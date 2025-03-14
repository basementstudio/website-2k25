import { OrthographicCamera } from "@react-three/drei"
import { animate, MotionValue } from "motion"
import { memo, useEffect, useMemo, useRef } from "react"
import {
  DepthTexture,
  OrthographicCamera as ThreeOrthographicCamera,
  Texture
} from "three"

import { useAssets } from "@/components/assets-provider"
import { ANIMATION_CONFIG } from "@/constants/inspectables"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { createPostProcessingMaterial } from "@/shaders/material-postprocessing"

import { revealOpacityMaterials } from "../map/bakes"
import { usePostprocessingSettings } from "./use-postprocessing-settings"

interface PostProcessingProps {
  mainTexture: Texture
  depthTexture: DepthTexture
  cameraRef: React.RefObject<ThreeOrthographicCamera | null>
}

const Inner = ({
  mainTexture,
  depthTexture,
  cameraRef
}: PostProcessingProps) => {
  const scene = useCurrentScene()
  const assets = useAssets()
  const firstRender = useRef(true)

  const material = useMemo(() => createPostProcessingMaterial(), [])

  useEffect(() => {
    revealOpacityMaterials.add(material)
    return () => {
      revealOpacityMaterials.delete(material)
    }
  }, [material])

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

  useFrameCallback(() => {
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
    window.addEventListener("resize", resize, { signal, passive: true })

    material.uniforms.uMainTexture.value = mainTexture
    material.uniforms.uDepthTexture.value = depthTexture

    console.log(depthTexture)

    return () => controller.abort()
  }, [mainTexture, depthTexture])

  useFrameCallback((_, __, elapsedTime) => {
    material.uniforms.uTime.value = elapsedTime
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

export const PostProcessing = memo(Inner)
