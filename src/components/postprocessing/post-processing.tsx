import { OrthographicCamera } from "@react-three/drei"
import { animate, MotionValue } from "motion"
import { memo, useEffect, useMemo, useRef } from "react"
import {
  DepthTexture,
  OrthographicCamera as ThreeOrthographicCamera,
  Texture
} from "three"

import { useAssets } from "@/components/assets-provider"
import { revealOpacityMaterials } from "@/components/map/bakes"
import { ANIMATION_CONFIG } from "@/constants/inspectables"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useDeviceDetect } from "@/hooks/use-device-detect"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { createPostProcessingMaterial } from "@/shaders/material-postprocessing"

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
  const { isMobile } = useDeviceDetect()

  const { material, uniforms } = useMemo(
    () => createPostProcessingMaterial(),
    []
  )

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
      uniforms.uContrast.value = targets.contrast.get()
      uniforms.uBrightness.value = targets.brightness.get()
      uniforms.uExposure.value = targets.exposure.get()
      uniforms.uGamma.value = targets.gamma.get()
      uniforms.uVignetteRadius.value = targets.vignetteRadius.get()
      uniforms.uVignetteSpread.value = targets.vignetteSpread.get()
      uniforms.uBloomStrength.value = targets.bloomStrength.get()
      uniforms.uBloomRadius.value = targets.bloomRadius.get()
      uniforms.uBloomThreshold.value = targets.bloomThreshold.get()
    } else {
      uniforms.uContrast.value = basics.contrast
      uniforms.uBrightness.value = basics.brightness
      uniforms.uExposure.value = basics.exposure
      uniforms.uGamma.value = basics.gamma
      uniforms.uVignetteRadius.value = vignette.radius
      uniforms.uVignetteSpread.value = vignette.spread
      uniforms.uBloomStrength.value = bloom.strength
      uniforms.uBloomRadius.value = bloom.radius
      uniforms.uBloomThreshold.value = bloom.threshold
    }
  })

  const lastScreenSize = useRef({ w: 0, h: 0 })

  useEffect(() => {
    uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
    uniforms.uActiveBloom.value = isMobile ? 0 : 1
    uniforms.uMainTexture.value = mainTexture
    uniforms.uDepthTexture.value = depthTexture

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainTexture, depthTexture, isMobile])

  useFrameCallback(({ size }) => {
    // Update resolution without React re-renders
    if (size.width !== lastScreenSize.current.w || size.height !== lastScreenSize.current.h) {
      lastScreenSize.current.w = size.width
      lastScreenSize.current.h = size.height
      uniforms.resolution.value.set(size.width, size.height)
    }
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
