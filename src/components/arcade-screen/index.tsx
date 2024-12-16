import { useFrame, useThree } from "@react-three/fiber"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  Texture
} from "three"
import { Box3, Vector3, WebGLRenderTarget } from "three"

import { createShaderMaterial } from "@/shaders/custom-shader-material"

import { RenderTexture } from "./render-texture"
import { screenMaterial } from "./screen-material"
import { ScreenUI } from "./screen-ui"

export const ArcadeScreen = () => {
  const { scene } = useThree()
  const pathname = usePathname()
  const [arcadeScreen, setArcadeScreen] = useState<Mesh | null>(null)
  const [screenPosition, setScreenPosition] = useState<Vector3 | null>(null)
  const [screenScale, setScreenScale] = useState<Vector3 | null>(null)

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
    screenMaterial.uniforms.screenSize.value = [2500, 2500]
    screenMaterial.uniforms.rgbActive.value = true

    arcadeScreen.material = screenMaterial
  }, [arcadeScreen, renderTarget.texture])

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
