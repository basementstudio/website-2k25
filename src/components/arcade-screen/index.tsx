import { useFrame, useThree } from "@react-three/fiber"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Mesh, MeshStandardMaterial } from "three"
import { Box3, Vector3, WebGLRenderTarget } from "three"

import { createShaderMaterial } from "@/shaders/custom-shader-material"

import { RenderTexture } from "./render-texture"
import { ScreenUI } from "./screen-ui"

export const ArcadeScreen = () => {
  const { scene } = useThree()
  const pathname = usePathname()
  const [arcadeScreen, setArcadeScreen] = useState<Mesh | null>(null)
  const [screenPosition, setScreenPosition] = useState<Vector3 | null>(null)
  const [screenScale, setScreenScale] = useState<Vector3 | null>(null)

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

  const renderTarget = useMemo(() => {
    return new WebGLRenderTarget()
  }, [])

  useEffect(() => {
    if (!arcadeScreen) return
    const newMaterial = new MeshStandardMaterial({
      map: renderTarget.texture,
      color: "#fff"
    })
    const shaderMaterial = createShaderMaterial(newMaterial, null, false)
    arcadeScreen.material = shaderMaterial
  }, [arcadeScreen, renderTarget.texture])

  useFrame((state) => {
    const { gl } = state
    gl.setRenderTarget(renderTarget)
    gl.setRenderTarget(null)
  })

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
