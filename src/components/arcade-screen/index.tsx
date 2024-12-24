import { useVideoTexture } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useMemo, useState } from "react"
import { Mesh, TextureLoader } from "three"
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

  const videoTexture = useVideoTexture(
    "/videos/arcade-screen/screen-load.webm",
    {
      loop: true
    }
  )

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

  const reflectionTexture = useMemo(() => {
    return new TextureLoader().load("/textures/arcade-screen/reflection.jpg")
  }, [])

  const smudgesTexture = useMemo(() => {
    return new TextureLoader().load("/textures/arcade-screen/smudges.jpg")
  }, [])

  useEffect(() => {
    if (!arcadeScreen) return

    screenMaterial.uniforms.reflectionTexture.value = reflectionTexture
    screenMaterial.uniforms.smudgesTexture.value = smudgesTexture
    videoTexture.flipY = false
    if (pathname === "/arcade") {
      screenMaterial.uniforms.map.value = renderTarget.texture
    } else {
      screenMaterial.uniforms.map.value = videoTexture
    }

    arcadeScreen.material = screenMaterial
  }, [
    reflectionTexture,
    smudgesTexture,
    arcadeScreen,
    renderTarget.texture,
    videoTexture,
    pathname
  ])

  useFrame((_, delta) => {
    if (screenMaterial.uniforms.uTime) {
      screenMaterial.uniforms.uTime.value += delta
    }
  })

  if (!arcadeScreen || !screenPosition || !screenScale) return null

  return (
    <RenderTexture
      isPlaying={true}
      fbo={renderTarget}
      useGlobalPointer={false}
      raycasterMesh={arcadeScreen}
    >
      <Suspense fallback={null}>
        {pathname === "/arcade" ? <ScreenUI screenScale={screenScale} /> : null}
      </Suspense>
    </RenderTexture>
  )
}
