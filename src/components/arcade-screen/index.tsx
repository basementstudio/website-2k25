import { useFrame, useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Mesh } from "three"
import { Box3, Vector3, WebGLRenderTarget } from "three"

import { RenderTexture } from "./render-texture"
import { screenMaterial } from "./screen-material"
import { ScreenUI } from "./screen-ui"

export const ArcadeScreen = () => {
  const { scene } = useThree()
  const pathname = usePathname()
  const [arcadeScreen, setArcadeScreen] = useState<Mesh | null>(null)
  const [screenPosition, setScreenPosition] = useState<Vector3 | null>(null)
  const [screenScale, setScreenScale] = useState<Vector3 | null>(null)

  const {
    uPixelSize,
    uNoiseIntensity,
    uScanlineIntensity,
    uScanlineFrequency,
    uIsMonochrome,
    uMonochromeColor
  } = useControls("Arcade Screen", {
    uPixelSize: {
      value: 1024.0,
      min: 16.0,
      max: 1200.0,
      step: 1.0
    },
    uNoiseIntensity: {
      value: 0.64,
      min: 0.0,
      max: 1.0,
      step: 0.01
    },
    uScanlineIntensity: {
      value: 0.4,
      min: 0.0,
      max: 1.0,
      step: 0.01
    },
    uScanlineFrequency: {
      value: 1024.0,
      min: 1.0,
      max: 1024.0,
      step: 1.0
    },
    uIsMonochrome: { value: true },
    uMonochromeColor: { value: "#ff7f00" }
  })

  const renderTarget = useMemo(() => {
    return new WebGLRenderTarget(1024, 1024)
  }, [])

  useEffect(() => {
    const screen = scene.getObjectByName("SM_ArcadeLab_Screen")
    setArcadeScreen(screen as Mesh)
    if (screen) {
      const box = new Box3().setFromObject(screen)
      const size = box.getSize(new Vector3())
      const center = box.getCenter(new Vector3())
      setScreenPosition(center)
      setScreenScale(size)
    }
  }, [scene])

  useEffect(() => {
    if (!arcadeScreen) return

    screenMaterial.uniforms.map.value = renderTarget.texture
    arcadeScreen.material = screenMaterial
  }, [arcadeScreen, renderTarget.texture])

  useFrame((_, delta) => {
    if (screenMaterial.uniforms.uTime) {
      screenMaterial.uniforms.uTime.value += delta
    }
  })

  useEffect(() => {
    if (!arcadeScreen) return

    screenMaterial.uniforms.map.value = renderTarget.texture
    screenMaterial.uniforms.uPixelSize.value = uPixelSize
    screenMaterial.uniforms.uNoiseIntensity.value = uNoiseIntensity
    screenMaterial.uniforms.uScanlineIntensity.value = uScanlineIntensity
    screenMaterial.uniforms.uScanlineFrequency.value = uScanlineFrequency
    screenMaterial.uniforms.uIsMonochrome.value = uIsMonochrome
    arcadeScreen.material = screenMaterial
  }, [
    arcadeScreen,
    uPixelSize,
    uNoiseIntensity,
    uScanlineIntensity,
    uScanlineFrequency,
    uIsMonochrome,
    uMonochromeColor,
    renderTarget.texture
  ])

  if (!arcadeScreen || !screenPosition || !screenScale) return null

  return (
    <RenderTexture
      isPlaying={pathname === "/arcade"}
      fbo={renderTarget}
      useGlobalPointer={false}
      raycasterMesh={arcadeScreen}
    >
      <ScreenUI />
    </RenderTexture>
  )
}
